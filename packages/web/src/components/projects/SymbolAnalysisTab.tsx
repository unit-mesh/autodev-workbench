import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Code, Search, Loader2, CheckCircle, Circle, Book } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dispatch, SetStateAction, useState, useMemo } from "react"
import { toast } from "@/hooks/use-toast"
import { SymbolAnalysis } from "@/types/project.type";

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

      <div className="flex flex-wrap gap-2 mb-4">
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

      {symbolLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="overflow-hidden">
              <CardHeader className="p-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : symbols.length > 0 ? (
        <div className="space-y-2">
          {symbols.map((symbol) => {
            const isLongContext = typeof symbol.detail?.totalSymbols === 'number' && symbol.detail.totalSymbols >= LONG_CONTEXT_THRESHOLD;
            const isSelected = selectedSymbolIds.includes(symbol.id);
            const hasIdentifiedConcepts = symbol.identifiedConcepts && symbol.identifiedConcepts.length > 0;
            
            return (
              <Card
                key={symbol.id}
                className={`overflow-hidden py-2 gap-0 
                  ${isLongContext ? 'bg-blue-50 border-blue-200' : ''} 
                  ${hasIdentifiedConcepts ? 'border-l-4 border-l-green-500' : ''}
                  ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
              >
                <CardHeader className="p-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleSymbolSelection(symbol.id)}
                        className="flex-shrink-0 focus:outline-none"
                      >
                        {isSelected ? (
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300" />
                        )}
                      </button>
                      <div>
                        <CardTitle className="text-base flex items-center">
                          {symbol.name}
                          {isLongContext && (
                            <span className="ml-2 text-xs font-semibold text-blue-700 bg-blue-200 px-1.5 py-0.5 rounded-full">
                              长上下文
                            </span>
                          )}
                          {hasIdentifiedConcepts && (
                            <span className="ml-2 text-xs font-semibold text-green-700 bg-green-200 px-1.5 py-0.5 rounded-full flex items-center">
                              <Book className="h-3 w-3 mr-1" />
                              已识别概念 {symbol.identifiedConcepts.length}
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs font-mono mt-1">
                          {symbol.path}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAnalyzeSymbol(symbol.id)}
                      disabled={analyzingSymbolIds.includes(symbol.id) || isGeneratingConcepts}
                      className={hasIdentifiedConcepts 
                        ? "border-green-300 hover:bg-green-100" 
                        : isLongContext 
                          ? "border-blue-300 hover:bg-blue-100" 
                          : ""}
                    >
                      {analyzingSymbolIds.includes(symbol.id) ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          分析中...
                        </>
                      ) : hasIdentifiedConcepts ? (
                        "更新概念"
                      ) : (
                        "AI分析"
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-2">
                  {symbol.detail && <span className="text-xs">${JSON.stringify(symbol.detail)}</span>}
                  <div className="text-xs text-gray-400 mt-2">
                    更新于: {new Date(symbol.updatedAt).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
          <Code className="h-12 w-12 text-gray-300"/>
          <p className="text-center text-gray-500">暂无关键代码标识数据</p>
        </div>
      )}
    </div>
  );
}
