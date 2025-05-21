import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BookOpen, RotateCw, AlertTriangle, GitMerge } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

interface ConceptDictionary {
  id: string
  termChinese: string
  termEnglish: string
  descChinese: string
}

type DuplicateGroup = {
  group: { id: string; term: string }[];
  reason: string;
  recommendation: string;
}

type MergeSuggestion = {
  group: { id: string; term: string }[];
  reason: string;
  mergedTerm: {
    termChinese: string;
    termEnglish: string;
    descChinese: string;
  };
}

interface ConceptDictionaryTabProps {
  conceptDictionaries: ConceptDictionary[]
}

export function ConceptDictionaryTab({ conceptDictionaries }: ConceptDictionaryTabProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<{
    duplicates: DuplicateGroup[];
    mergeSuggestions: MergeSuggestion[];
    analysis: string;
  } | null>(null)

  const handleAnalyzeConcepts = async () => {
    if (conceptDictionaries.length <= 1) {
      toast({
        title: "分析失败",
        description: "需要至少两个概念才能进行分析",
        variant: "destructive"
      })
      return
    }

    setAnalyzing(true)
    try {
      const response = await fetch('/api/analyze-concepts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          concepts: conceptDictionaries
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAnalysisResults({
          duplicates: data.duplicates || [],
          mergeSuggestions: data.mergeSuggestions || [],
          analysis: data.analysis || ""
        })
        setShowAnalysisDialog(true)
      } else {
        toast({
          title: "分析失败",
          description: data.message || "无法分析概念词典",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "分析失败",
        description: "处理请求时出错",
        variant: "destructive"
      })
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <>
      {conceptDictionaries.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">概念词典</h3>
            <Button
              onClick={handleAnalyzeConcepts}
              disabled={analyzing || conceptDictionaries.length <= 1}
              size="sm"
            >
              {analyzing ? <Spinner className="mr-2 h-4 w-4" /> : <RotateCw className="mr-2 h-4 w-4" />}
              AI 分析概念
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">中文术语
                  </th>
                  <th scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">英文术语
                  </th>
                  <th scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">中文描述
                  </th>
                  <th scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {conceptDictionaries.map((term) => (
                  <tr key={term.id}>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{term.termChinese}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{term.termEnglish}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{term.descChinese}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button size="sm" variant="ghost">查看</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
          <BookOpen className="h-12 w-12 text-gray-300" />
          <p className="text-center text-gray-500">暂无概念词典</p>
        </div>
      )}

      {/* 分析结果对话框 */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>概念词典分析结果</DialogTitle>
            <DialogDescription>
              AI 分析了您的概念词典，以下是发现的问题和建议
            </DialogDescription>
          </DialogHeader>

          {analysisResults && (
            <div className="space-y-4">
              {/* 整体分析 */}
              <div className="p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium mb-2">整体分析</h4>
                <p className="text-sm">{analysisResults.analysis}</p>
              </div>

              {/* 重复概念 */}
              {analysisResults.duplicates.length > 0 && (
                <div>
                  <h4 className="font-medium flex items-center mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                    检测到的重复概念
                  </h4>
                  <div className="space-y-3">
                    {analysisResults.duplicates.map((duplicate, idx) => (
                      <div key={idx} className="p-3 border rounded-md">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {duplicate.group.map(item => (
                            <span key={item.id} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                              {item.term}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm mb-1"><span className="font-medium">原因：</span>{duplicate.reason}</p>
                        <p className="text-sm"><span className="font-medium">建议：</span>{duplicate.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 合并建议 */}
              {analysisResults.mergeSuggestions.length > 0 && (
                <div>
                  <h4 className="font-medium flex items-center mb-2">
                    <GitMerge className="h-4 w-4 text-blue-500 mr-2" />
                    合并建议
                  </h4>
                  <div className="space-y-3">
                    {analysisResults.mergeSuggestions.map((suggestion, idx) => (
                      <div key={idx} className="p-3 border rounded-md">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {suggestion.group.map(item => (
                            <span key={item.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {item.term}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm mb-2"><span className="font-medium">原因：</span>{suggestion.reason}</p>
                        <div className="bg-gray-50 p-2 rounded-md mb-1 text-sm">
                          <p><span className="font-medium">建议合并为：</span></p>
                          <p>中文术语：{suggestion.mergedTerm.termChinese}</p>
                          <p>英文术语：{suggestion.mergedTerm.termEnglish}</p>
                          <p>描述：{suggestion.mergedTerm.descChinese}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 无问题情况 */}
              {analysisResults.duplicates.length === 0 && analysisResults.mergeSuggestions.length === 0 && (
                <div className="text-center p-4">
                  <p className="text-green-600">您的概念词典没有检测到重复或需要合并的概念。</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowAnalysisDialog(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
