import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { BookOpen, RotateCw, Trash2, Eye } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AIConceptDictionaryResultsDialog } from "./AIConceptDictionaryResultsDialog";

interface ConceptDictionary {
  id: string
  termChinese: string
  termEnglish: string
  descChinese: string
  relatedTerms?: string[] // Optional: if you fetch this directly
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
    relatedTerms?: string[]; // Added relatedTerms here
  };
}

type RelatedTermAnalysis = {
  termId: string;
  relatedTermIds: string[];
  relationshipType: string;
  reason: string;
}

interface ConceptDictionaryTabProps {
  conceptDictionaries: ConceptDictionary[]
}

export function ConceptDictionaryTab({ conceptDictionaries: initialDictionaries }: ConceptDictionaryTabProps) {
  const [conceptDictionaries, setConceptDictionaries] = useState(initialDictionaries);
  const [analyzing, setAnalyzing] = useState(false)
  const [merging, setMerging] = useState(false)
  const [showAIOptimizationDialog, setShowAIOptimizationDialog] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<{
    duplicates: DuplicateGroup[];
    mergeSuggestions: MergeSuggestion[];
    relatedTerms: RelatedTermAnalysis[]; // Added for top-level related terms analysis
    analysis: string;
  } | null>(null)
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({})
  const [mergingGroupIndex, setMergingGroupIndex] = useState<number | null>(null)

  // State for view dialog
  const [viewingConcept, setViewingConcept] = useState<ConceptDictionary | null>(null)

  // State for delete confirmation
  const [deletingConceptId, setDeletingConceptId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // State for batch delete
  const [selectedForBatchDelete, setSelectedForBatchDelete] = useState<Record<string, boolean>>({})
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false)
  const [isBatchDeleting, setIsBatchDeleting] = useState(false)

  const [isFetching, setIsFetching] = useState(false);
  const fetchDictionary = useCallback(async () => {
    try {
      setIsFetching(true);
      const response = await fetch('/api/concepts');
      if (!response.ok) {
        throw new Error('Failed to fetch dictionary data');
      }
      const data = await response.json();
      setConceptDictionaries(data);
    } catch (error) {
      console.error('Error fetching dictionary:', error);
      toast({
        title: "刷新失败",
        description: "无法获取最新的概念词典数据",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  }, []);

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
          relatedTerms: data.relatedTerms || [], // Store top-level related terms
          analysis: data.analysis || ""
        })
        // Show the AI optimization dialog
        setShowAIOptimizationDialog(true)
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

  const handleMergeAllConcepts = async () => {
    if (!analysisResults) return
    const selectedGroups = [];

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

    for (const [, group] of analysisResults.mergeSuggestions.entries()) {
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

        setSelectedItems({})
        setShowAIOptimizationDialog(false)
        // Fetch fresh dictionary data instead of reload
        await fetchDictionary();
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
            ? (group as MergeSuggestion).mergedTerm // This now includes relatedTerms if AI provided it
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

        // Close dialog and fetch fresh data instead of reload
        setShowAIOptimizationDialog(false)
        await fetchDictionary();
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

  const handleViewConcept = (concept: ConceptDictionary) => {
    setViewingConcept(concept)
  }

  const handleDeleteConcept = async () => {
    if (!deletingConceptId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/concepts?id=${deletingConceptId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "删除成功",
          description: "已成功删除概念词典条目",
          variant: "default"
        })
        // Fetch fresh dictionary data instead of reload
        await fetchDictionary();
      } else {
        toast({
          title: "删除失败",
          description: data.error || "无法删除概念词典条目",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "删除失败",
        description: "处理删除请求时出错",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
      setDeletingConceptId(null)
    }
  }

  // Toggle batch selection
  const toggleBatchSelection = (id: string) => {
    setSelectedForBatchDelete(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const toggleSelectAll = (select: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newSelection: any = {}
    if (select) {
      conceptDictionaries.forEach(concept => {
        newSelection[concept.id] = true
      })
    }
    setSelectedForBatchDelete(newSelection)
  }

  // Handle batch deletion
  const handleBatchDelete = async () => {
    const selectedIds = Object.keys(selectedForBatchDelete).filter(id => selectedForBatchDelete[id])

    if (selectedIds.length === 0) {
      toast({
        title: "删除失败",
        description: "请至少选择一个概念词典条目",
        variant: "destructive"
      })
      return
    }

    setIsBatchDeleting(true)
    try {
      const response = await fetch('/api/concepts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "批量删除成功",
          description: `已成功删除 ${data.deletedCount} 个概念词典条目`,
          variant: "default"
        })
        await fetchDictionary();
      } else {
        toast({
          title: "批量删除失败",
          description: data.error || "无法删除概念词典条目",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "批量删除失败",
        description: "处理删除请求时出错",
        variant: "destructive"
      })
    } finally {
      setIsBatchDeleting(false)
      setShowBatchDeleteConfirm(false)
      setSelectedForBatchDelete({})
    }
  }

  // Function to handle closing the AI optimization dialog and refreshing the dictionary
  const handleCloseAIOptimizationDialog = useCallback((open: boolean) => {
    if (!open) {
      setShowAIOptimizationDialog(false);
      fetchDictionary();
    }
  }, [fetchDictionary]);

  const selectedCount = Object.values(selectedForBatchDelete).filter(Boolean).length

  return (
    <>
      {isFetching && (
        <div className="fixed inset-0 bg-black/5 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-md shadow-md flex items-center">
            <Spinner className="mr-2 h-5 w-5" />
            <span>正在加载概念词典...</span>
          </div>
        </div>
      )}

      {conceptDictionaries.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">概念词典</h3>
            <div className="flex items-center gap-2">
              {selectedCount > 0 && (
                <Button
                  onClick={() => setShowBatchDeleteConfirm(true)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  批量删除 ({selectedCount})
                </Button>
              )}
              <Button
                onClick={handleAnalyzeConcepts}
                disabled={analyzing || conceptDictionaries.length <= 1}
                size="sm"
              >
                {analyzing ? <Spinner className="mr-2 h-4 w-4" /> : <RotateCw className="mr-2 h-4 w-4" />}
                AI 分析概念
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3">
                    <Checkbox
                      id="select-all"
                      checked={conceptDictionaries.length > 0 && selectedCount === conceptDictionaries.length}
                      onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                    />
                  </th>
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
                    <td className="px-3 py-4">
                      <Checkbox
                        id={`select-${term.id}`}
                        checked={!!selectedForBatchDelete[term.id]}
                        onCheckedChange={() => toggleBatchSelection(term.id)}
                      />
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{term.termChinese}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{term.termEnglish}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{term.descChinese}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => handleViewConcept(term)}>
                          <Eye className="h-4 w-4 mr-1" /> 查看
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-800" onClick={() => setDeletingConceptId(term.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> 删除
                        </Button>
                      </div>
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

      <Dialog open={!!viewingConcept} onOpenChange={(open) => !open && setViewingConcept(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>概念详情</DialogTitle>
          </DialogHeader>
          {viewingConcept && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1 text-sm text-gray-500">中文术语</h4>
                <p>{viewingConcept.termChinese}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1 text-sm text-gray-500">英文术语</h4>
                <p>{viewingConcept.termEnglish}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1 text-sm text-gray-500">中文描述</h4>
                <p className="whitespace-pre-wrap">{viewingConcept.descChinese}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewingConcept(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingConceptId} onOpenChange={(open) => !open && !isDeleting && setDeletingConceptId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这个概念词典条目吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={handleDeleteConcept}>
              {isDeleting ? <Spinner className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBatchDeleteConfirm} onOpenChange={(open) => !open && !isBatchDeleting && setShowBatchDeleteConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除所选的 {selectedCount} 个概念词典条目吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction disabled={isBatchDeleting} onClick={handleBatchDelete}>
              {isBatchDeleting ? <Spinner className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4" />}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Use the new separated component for AI optimization results */}
      <AIConceptDictionaryResultsDialog
        open={showAIOptimizationDialog}
        onOpenChange={handleCloseAIOptimizationDialog}
        analysisResults={analysisResults}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        merging={merging}
        mergingGroupIndex={mergingGroupIndex}
        onMergeAllConcepts={handleMergeAllConcepts}
        onMergeConcepts={handleMergeConcepts}
        refreshDictionary={fetchDictionary}
      />
    </>
  )
}
