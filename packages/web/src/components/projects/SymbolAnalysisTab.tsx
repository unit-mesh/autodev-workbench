import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Code, Search, Loader2, CheckCircle, Circle, Book } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dispatch, SetStateAction, useState, useMemo } from "react"
import { toast } from "@/hooks/use-toast"
import { SymbolAnalysis } from "@/types/project.type";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

export interface SymbolAnalysisTabProps {
  symbols: SymbolAnalysis[];
  symbolSearch: string;
  symbolLoading: boolean;
  setSymbolSearch: Dispatch<SetStateAction<string>>;
  fetchSymbols: (query?: string) => Promise<void>;
  projectId: string;
  refreshProject: () => void;
}

const LONG_CONTEXT_THRESHOLD = 5; // Symbols with detail.totalSymbols >= this are "long context"
const MIN_RELEVANT_SYMBOLS_THRESHOLD = 3; // Symbols with detail.totalSymbols < this are excluded from batch analysis

const filterSymbolsByCategory = (
  symbols: SymbolAnalysis[],
  category: 'long' | 'other',
  longThreshold: number,
  minRelevantThreshold: number
): SymbolAnalysis[] => {
  return symbols.filter(symbol => {
    const totalSymbols = symbol.detail?.totalSymbols;
    if (category === 'long') {
      return typeof totalSymbols === 'number' && totalSymbols >= longThreshold;
    } else { // 'other'
      return typeof totalSymbols === 'number' && totalSymbols < longThreshold && totalSymbols >= minRelevantThreshold;
    }
  });
};

function SymbolDetails({ symbol }: { symbol: SymbolAnalysis }) {
  return (
    <div className="space-y-2 p-2">
      <div className="flex justify-between">
        <span className="font-medium">符号详情</span>
        <span className="text-xs text-gray-500">{JSON.stringify(symbol.detail?.summary)}</span>
      </div>
    </div>
  );
}

export function SymbolAnalysisTab({
  symbols,
  symbolSearch,
  symbolLoading,
  setSymbolSearch,
  fetchSymbols,
  projectId,
  refreshProject,
}: SymbolAnalysisTabProps) {
  const [analyzingSymbolIds, setAnalyzingSymbolIds] = useState<string[]>([]);
  const [selectedSymbolIds, setSelectedSymbolIds] = useState<string[]>([]);
  const [isGeneratingConcepts, setIsGeneratingConcepts] = useState(false);

  const longContextSymbols = useMemo(
    () => filterSymbolsByCategory(symbols, 'long', LONG_CONTEXT_THRESHOLD, MIN_RELEVANT_SYMBOLS_THRESHOLD),
    [symbols]
  );
  const otherContextSymbols = useMemo(
    () => filterSymbolsByCategory(symbols, 'other', LONG_CONTEXT_THRESHOLD, MIN_RELEVANT_SYMBOLS_THRESHOLD),
    [symbols]
  );

  const handleSelectLongContextSymbols = () => {
    setSelectedSymbolIds(longContextSymbols.map(s => s.id));
  };

  const handleSelectOtherSymbols = () => {
    setSelectedSymbolIds(otherContextSymbols.map(s => s.id));
  };

  const handleSelectAllSymbols = () => {
    setSelectedSymbolIds(symbols.map(s => s.id));
  };

  const handleClearSelection = () => {
    setSelectedSymbolIds([]);
  };

  const handleToggleSymbolSelection = (symbolId: string) => {
    setSelectedSymbolIds(prev =>
      prev.includes(symbolId)
        ? prev.filter(id => id !== symbolId)
        : [...prev, symbolId]
    );
  };

  const handleSymbolSearch = () => {
    fetchSymbols(symbolSearch);
  };

  const _analyzeSingleSymbol = async (symbolId: string, currentProjectId: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/symbols/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbolId,
          projectId: currentProjectId
        })
      });
      return response.ok;
    } catch (error) {
      console.error("Error analyzing symbol:", error);
      return false;
    }
  };

  const handleAnalyzeSymbol = async (symbolId: string) => {
    setAnalyzingSymbolIds(prev => [...new Set([...prev, symbolId])]);
    const success = await _analyzeSingleSymbol(symbolId, projectId);
    const symbolName = symbols.find(s => s.id === symbolId)?.name || symbolId;

    if (success) {
      toast({
        title: "成功",
        description: `符号 ${symbolName} 分析已完成，概念已添加到词典`,
        variant: "default"
      });
      refreshProject();
    } else {
      toast({
        title: "错误",
        description: `符号 ${symbolName} 分析失败`,
        variant: "destructive"
      });
    }
    setAnalyzingSymbolIds(prev => prev.filter(id => id !== symbolId));
  };

  const handleGenerateSelectedConcepts = async () => {
    if (selectedSymbolIds.length === 0) {
      toast({
        title: "未选择符号",
        description: "请先选择需要分析的符号。",
      });
      return;
    }

    setIsGeneratingConcepts(true);
    setAnalyzingSymbolIds(prev => [...new Set([...prev, ...selectedSymbolIds])]);

    const symbolsToAnalyze = symbols.filter(s => selectedSymbolIds.includes(s.id));
    const results = await Promise.allSettled(
      symbolsToAnalyze.map(symbol => _analyzeSingleSymbol(symbol.id, projectId))
    );

    let successes = 0;
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        successes++;
      }
    });

    if (successes === symbolsToAnalyze.length) {
      toast({
        title: "概念生成完成",
        description: `所有 ${successes} 个选中关键代码标识成功。`,
        variant: "default"
      });
    } else if (successes > 0) {
      toast({
        title: "概念生成部分完成",
        description: `${successes} 个关键代码标识成功，${symbolsToAnalyze.length - successes} 个失败。`,
        variant: "default"
      });
    } else {
      toast({
        title: "概念生成失败",
        description: `所有 ${symbolsToAnalyze.length} 个关键代码标识均失败。`,
        variant: "destructive"
      });
    }

    if (successes > 0) {
      refreshProject();
    }

    setAnalyzingSymbolIds(prev => prev.filter(id => !selectedSymbolIds.includes(id)));
    setIsGeneratingConcepts(false);
  };

  return (
    <div className="space-y-4">
      {/* 搜索与批量操作区 */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="搜索符号..."
          value={symbolSearch}
          onChange={(e) => setSymbolSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" size="sm" onClick={handleSymbolSearch} disabled={symbolLoading}>
          {symbolLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
          搜索
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        <Button
          size="sm"
          onClick={handleSelectLongContextSymbols}
          disabled={symbolLoading || longContextSymbols.length === 0}
          variant="outline"
          className="border-blue-300 text-blue-700"
        >
          选择长上下文符号 ({longContextSymbols.length})
        </Button>
        <Button
          size="sm"
          onClick={handleSelectOtherSymbols}
          disabled={symbolLoading || otherContextSymbols.length === 0}
          variant="outline"
        >
          选择其它符号 ({otherContextSymbols.length})
        </Button>
        <Button
          size="sm"
          onClick={handleSelectAllSymbols}
          disabled={symbolLoading || symbols.length === 0}
          variant="outline"
        >
          全选 ({symbols.length})
        </Button>
        <Button
          size="sm"
          onClick={handleClearSelection}
          disabled={symbolLoading || selectedSymbolIds.length === 0}
          variant="outline"
          className="border-gray-300"
        >
          清除选择 ({selectedSymbolIds.length})
        </Button>
        <Button
          size="sm"
          onClick={handleGenerateSelectedConcepts}
          disabled={isGeneratingConcepts || symbolLoading || selectedSymbolIds.length === 0}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 ml-auto"
        >
          {isGeneratingConcepts ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          AI 生成/更新概念词典 ({selectedSymbolIds.length})
        </Button>
      </div>
      {/* 表格展示符号信息 */}
      <div className="overflow-x-auto">
        {symbolLoading ? (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="p-2">选择</th>
                <th className="p-2">符号名</th>
                <th className="p-2">文件路径</th>
                <th className="p-2">总符号数</th>
                <th className="p-2">已识别概念</th>
                <th className="p-2">类型</th>
                <th className="p-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((n) => (
                <tr key={n}>
                  <td className="p-2"><Skeleton className="h-5 w-5" /></td>
                  <td className="p-2"><Skeleton className="h-5 w-24" /></td>
                  <td className="p-2"><Skeleton className="h-5 w-40" /></td>
                  <td className="p-2"><Skeleton className="h-5 w-10" /></td>
                  <td className="p-2"><Skeleton className="h-5 w-10" /></td>
                  <td className="p-2"><Skeleton className="h-5 w-12" /></td>
                  <td className="p-2"><Skeleton className="h-5 w-16" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : symbols.length > 0 ? (
          <>
            <table className="min-w-full bg-white border rounded">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">选择</th>
                  <th className="p-2 text-left">符号名</th>
                  <th className="p-2 text-left">文件路径</th>
                  <th className="p-2 text-left">总符号数</th>
                  <th className="p-2 text-left">已识别概念</th>
                  <th className="p-2 text-left">类型</th>
                  <th className="p-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {symbols.map((symbol) => {
                  const isLongContext = typeof symbol.detail?.totalSymbols === 'number' && symbol.detail.totalSymbols >= LONG_CONTEXT_THRESHOLD;
                  const isSelected = selectedSymbolIds.includes(symbol.id);
                  const hasIdentifiedConcepts = symbol.identifiedConcepts && symbol.identifiedConcepts.length > 0;
                  const isAnalyzing = analyzingSymbolIds.includes(symbol.id);

                  return (
                    <tr
                      key={symbol.id}
                      className={
                        (isSelected ? "bg-blue-50 " : "") +
                        (hasIdentifiedConcepts ? "border-l-4 border-l-green-500 " : "") +
                        "hover:bg-gray-50"
                      }
                    >
                      <td className="p-2 align-middle">
                        <button
                          onClick={() => handleToggleSymbolSelection(symbol.id)}
                          className="focus:outline-none"
                          aria-label={isSelected ? "取消选择" : "选择"}
                        >
                          {isSelected ? (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300" />
                          )}
                        </button>
                      </td>
                      <td className="p-2 text-xs text-gray-600 font-mono align-middle">
                        {symbol.path}
                      </td>
                      <td className="p-2 text-center align-middle">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <span className="cursor-help border-b border-dotted border-gray-400">
                              {typeof symbol.detail?.totalSymbols === "number" ? symbol.detail.totalSymbols : "-"}
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80" align="start">
                            <SymbolDetails symbol={symbol} />
                          </HoverCardContent>
                        </HoverCard>
                      </td>
                      <td className="p-2 text-center align-middle">
                        {hasIdentifiedConcepts ? (
                          <span className="inline-flex items-center text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs">
                            <Book className="h-3 w-3 mr-1" />
                            {symbol.identifiedConcepts.length}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-2 text-center align-middle">
                        {isLongContext ? (
                          <span className="text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-xs font-semibold">长上下文</span>
                        ) : (
                          <span className="text-gray-500 text-xs">普通</span>
                        )}
                      </td>
                      <td className="p-2 text-center align-middle">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isAnalyzing}
                          onClick={() => handleAnalyzeSymbol(symbol.id)}
                        >
                          {isAnalyzing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Code className="h-4 w-4 mr-1" />}
                          分析
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 当只有一个符号时，在表格下方显示详情 */}
            {symbols.length === 1 && (
              <div className="mt-4 border rounded bg-gray-50">
                <SymbolDetails symbol={symbols[0]} />
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-400 text-center py-8">暂无符号数据</div>
        )}
      </div>
    </div>
  );
}
