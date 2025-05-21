import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Code, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Dispatch, SetStateAction, useState } from "react"
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

  const handleSymbolSearch = () => {
    fetchSymbols(symbolSearch);
  };

  const handleAnalyzeSymbol = async (symbolId: string) => {
    setAnalyzingSymbolIds(prev => [...prev, symbolId]);
    try {
      const response = await fetch("/api/symbols/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbolId,
          projectId: projectId
        })
      });

      if (response.ok) {
        toast({
          title: "成功",
          description: "符号分析已完成，概念已添加到词典",
          variant: "default"
        });
        refreshProject();
      } else {
        const errorData = await response.json();
        toast({
          title: "错误",
          description: errorData.message || "符号分析失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "错误",
        description: "处理符号分析时出错",
        variant: "destructive"
      });
    } finally {
      setAnalyzingSymbolIds(prev => prev.filter(id => id !== symbolId));
    }
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
          {symbols.map((symbol) => (
            <Card key={symbol.id} className="overflow-hidden py-2 gap-0">
              <CardHeader className="p-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">
                      {symbol.name}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono mt-1">
                      {symbol.path}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAnalyzeSymbol(symbol.id)}
                    disabled={analyzingSymbolIds.includes(symbol.id)}
                  >
                    {analyzingSymbolIds.includes(symbol.id) ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        分析中...
                      </>
                    ) : "AI分析"}
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
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
          <Code className="h-12 w-12 text-gray-300"/>
          <p className="text-center text-gray-500">暂无符号分析数据</p>
        </div>
      )}
    </div>
  );
}
