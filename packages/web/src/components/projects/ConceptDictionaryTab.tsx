import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BookOpen, RotateCw, AlertTriangle, GitMerge, Check } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox";

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
  const [merging, setMerging] = useState(false)
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<{
    duplicates: DuplicateGroup[];
    mergeSuggestions: MergeSuggestion[];
    analysis: string;
  } | null>(null)
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})
  const [mergingGroupIndex, setMergingGroupIndex] = useState<number | null>(null)

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
        // Clear any previously selected items
        setSelectedItems({})
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

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Select all items in a specific group
  const selectAllInGroup = (groupItems: { id: string; term: string }[], select: boolean) => {
    const newSelectedItems = { ...selectedItems };
    groupItems.forEach(item => {
      newSelectedItems[item.id] = select;
    });
    setSelectedItems(newSelectedItems);
  }

  // Select all items across all groups
  const selectAllItems = (select: boolean) => {
    const newSelectedItems = { ...selectedItems };

    if (analysisResults) {
      // Select/deselect all items in duplicates
      analysisResults.duplicates.forEach(group => {
        group.group.forEach(item => {
          newSelectedItems[item.id] = select;
        });
      });

      // Select/deselect all items in merge suggestions
      analysisResults.mergeSuggestions.forEach(group => {
        group.group.forEach(item => {
          newSelectedItems[item.id] = select;
        });
      });
    }

    setSelectedItems(newSelectedItems);
  }

  // Check if all items in a group are selected
  const areAllSelectedInGroup = (groupItems: { id: string; term: string }[]) => {
    return groupItems.every(item => selectedItems[item.id]);
  }

  // Check if any items in a group are selected
  const hasSelectionInGroup = (groupItems: { id: string; term: string }[]) => {
    return groupItems.some(item => selectedItems[item.id]);
  }

  // Count selected items in a group
  const countSelectedInGroup = (groupItems: { id: string; term: string }[]) => {
    return groupItems.filter(item => selectedItems[item.id]).length;
  }

  // Modified to handle merging concepts with new API structure
  const handleMergeAllConcepts = async () => {
    if (!analysisResults) return

    // Group selected concepts by their groups
    const selectedGroups = [];

    // Process duplicates groups
    for (const group of analysisResults.duplicates) {
      const selectedIdsInGroup = group.group
        .filter(item => selectedItems[item.id])
        .map(item => item.id);

      if (selectedIdsInGroup.length >= 2) {
        selectedGroups.push({
          conceptIds: selectedIdsInGroup,
          mergedTerm: undefined // Let backend select first concept as base
        });
      }
    }

    // Process merge suggestion groups
    for (const [index, group] of analysisResults.mergeSuggestions.entries()) {
      const selectedIdsInGroup = group.group
        .filter(item => selectedItems[item.id])
        .map(item => item.id);

      if (selectedIdsInGroup.length >= 2) {
        selectedGroups.push({
          conceptIds: selectedIdsInGroup,
          mergedTerm: group.mergedTerm
        });
      }
    }

    if (selectedGroups.length === 0) {
      toast({
        title: "合并失败",
        description: "请至少选择一组有效的概念进行合并",
        variant: "destructive"
      })
      return
    }

    setMerging(true)
    try {
      const response = await fetch('/api/analyze-concepts/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groups: selectedGroups
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "合并成功",
          description: `已成功合并${data.results.length}组概念`,
          variant: "default"
        })

        // Clear all selections
        setSelectedItems({})

        // Close the dialog
        setShowAnalysisDialog(false)
      } else {
        toast({
          title: "合并失败",
          description: data.message || "无法合并所选概念",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "合并失败",
        description: "处理合并请求时出错",
        variant: "destructive"
      })
    } finally {
      setMerging(false)
    }
  }

  // Updated to use the new API structure
  const handleMergeConcepts = async (groupType: 'duplicates' | 'mergeSuggestions', groupIndex: number) => {
    if (!analysisResults) return

    const group = analysisResults[groupType][groupIndex]
    const selectedIds = group.group
      .filter(item => selectedItems[item.id])
      .map(item => item.id)

    if (selectedIds.length < 2) {
      toast({
        title: "合并失败",
        description: "请至少选择两个概念进行合并",
        variant: "destructive"
      })
      return
    }

    setMerging(true)
    setMergingGroupIndex(groupIndex)
    try {
      const mergeData = {
        groups: [{
          conceptIds: selectedIds,
          // If from mergeSuggestions, use suggested merged term, otherwise use empty
          mergedTerm: groupType === 'mergeSuggestions'
            ? (group as MergeSuggestion).mergedTerm
            : undefined
        }]
      }

      const response = await fetch('/api/analyze-concepts/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mergeData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "合并成功",
          description: "已成功合并所选概念",
          variant: "default"
        })

        // Clear selection for merged items
        const newSelectedItems = {...selectedItems}
        selectedIds.forEach(id => {
          delete newSelectedItems[id]
        })
        setSelectedItems(newSelectedItems)

        // Optionally, refresh the concept list or close the dialog
        // For now, let's just close the dialog
        setShowAnalysisDialog(false)
      } else {
        toast({
          title: "合并失败",
          description: data.message || "无法合并所选概念",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "合并失败",
        description: "处理合并请求时出错",
        variant: "destructive"
      })
    } finally {
      setMerging(false)
      setMergingGroupIndex(null)
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

      {/* 分析结果对话框 - 增大尺寸 */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
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

              {/* 全局操作区域 */}
              {(analysisResults.duplicates.length > 0 || analysisResults.mergeSuggestions.length > 0) && (
                <div className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all-concepts"
                      checked={Object.keys(selectedItems).length > 0 &&
                        [...analysisResults.duplicates, ...analysisResults.mergeSuggestions]
                          .flatMap(group => group.group)
                          .every(item => selectedItems[item.id])}
                      onCheckedChange={(checked) => selectAllItems(!!checked)}
                    />
                    <label htmlFor="select-all-concepts" className="text-sm font-medium cursor-pointer">
                      全选所有概念
                    </label>
                  </div>
                  <Button
                    onClick={handleMergeAllConcepts}
                    disabled={merging || Object.values(selectedItems).filter(Boolean).length < 2}
                    className="flex items-center"
                  >
                    {merging ? <Spinner className="mr-2 h-4 w-4" /> : <GitMerge className="mr-2 h-4 w-4" />}
                    合并所有选中概念 ({Object.values(selectedItems).filter(Boolean).length})
                  </Button>
                </div>
              )}

              {/* 重复概念 */}
              {analysisResults.duplicates.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                      检测到的重复概念
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {analysisResults.duplicates.map((duplicate, idx) => (
                      <div key={idx} className="p-3 border rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`select-all-dup-${idx}`}
                              checked={areAllSelectedInGroup(duplicate.group)}
                              onCheckedChange={(checked) => selectAllInGroup(duplicate.group, !!checked)}
                            />
                            <label htmlFor={`select-all-dup-${idx}`} className="text-sm font-medium cursor-pointer">
                              全选此组 ({duplicate.group.length})
                            </label>
                          </div>
                          <Button
                            size="sm"
                            disabled={merging || countSelectedInGroup(duplicate.group) < 2}
                            onClick={() => handleMergeConcepts('duplicates', idx)}
                            className="flex items-center"
                          >
                            {merging && mergingGroupIndex === idx ?
                              <Spinner className="mr-2 h-3 w-3" /> :
                              <GitMerge className="mr-2 h-3 w-3" />
                            }
                            合并此组所选 ({countSelectedInGroup(duplicate.group)})
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {duplicate.group.map(item => (
                            <div key={item.id} className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                              <Checkbox
                                id={`dup-${idx}-${item.id}`}
                                checked={!!selectedItems[item.id]}
                                onCheckedChange={() => toggleItemSelection(item.id)}
                              />
                              <label htmlFor={`dup-${idx}-${item.id}`} className="cursor-pointer">{item.term}</label>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm mb-1"><span className="font-medium">原因：</span>{duplicate.reason}</p>
                        <p className="text-sm mb-3"><span className="font-medium">建议：</span>{duplicate.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 合并建议 */}
              {analysisResults.mergeSuggestions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center">
                      <GitMerge className="h-4 w-4 text-blue-500 mr-2" />
                      合并建议
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {analysisResults.mergeSuggestions.map((suggestion, idx) => (
                      <div key={idx} className="p-3 border rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`select-all-sug-${idx}`}
                              checked={areAllSelectedInGroup(suggestion.group)}
                              onCheckedChange={(checked) => selectAllInGroup(suggestion.group, !!checked)}
                            />
                            <label htmlFor={`select-all-sug-${idx}`} className="text-sm font-medium cursor-pointer">
                              全选此组 ({suggestion.group.length})
                            </label>
                          </div>
                          <Button
                            size="sm"
                            disabled={merging || countSelectedInGroup(suggestion.group) < 2}
                            onClick={() => handleMergeConcepts('mergeSuggestions', idx)}
                            className="flex items-center"
                          >
                            {merging && mergingGroupIndex === idx ?
                              <Spinner className="mr-2 h-3 w-3" /> :
                              <GitMerge className="mr-2 h-3 w-3" />
                            }
                            合并此组所选 ({countSelectedInGroup(suggestion.group)})
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {suggestion.group.map(item => (
                            <div key={item.id} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              <Checkbox
                                id={`sug-${idx}-${item.id}`}
                                checked={!!selectedItems[item.id]}
                                onCheckedChange={() => toggleItemSelection(item.id)}
                              />
                              <label htmlFor={`sug-${idx}-${item.id}`} className="cursor-pointer">{item.term}</label>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm mb-2"><span className="font-medium">原因：</span>{suggestion.reason}</p>
                        <div className="bg-gray-50 p-2 rounded-md mb-3 text-sm">
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
