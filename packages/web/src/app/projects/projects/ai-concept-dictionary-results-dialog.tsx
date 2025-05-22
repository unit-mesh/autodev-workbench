import { Button } from "@/components/ui/button"
import { BookOpen, GitMerge, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";

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
    relatedTerms?: string[];
  };
}

type RelatedTermAnalysis = {
  termId: string;
  relatedTermIds: string[];
  relationshipType: string;
  reason: string;
}

type AnalysisResults = {
  duplicates: DuplicateGroup[];
  mergeSuggestions: MergeSuggestion[];
  relatedTerms: RelatedTermAnalysis[];
  analysis: string;
}

interface AIConceptDictionaryResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisResults: AnalysisResults | null;
  selectedItems: Record<string, boolean>;
  setSelectedItems: (items: Record<string, boolean>) => void;
  merging: boolean;
  mergingGroupIndex: number | null;
  onMergeAllConcepts: () => Promise<void>;
  onMergeConcepts: (groupType: 'duplicates' | 'mergeSuggestions', groupIndex: number) => Promise<void>;
  refreshDictionary: () => Promise<void>; // New prop for refreshing dictionary data
}

export function AiConceptDictionaryResultsDialog({
  open,
  onOpenChange,
  analysisResults,
  selectedItems,
  setSelectedItems,
  merging,
  mergingGroupIndex,
  onMergeAllConcepts,
  onMergeConcepts,
  refreshDictionary
}: AIConceptDictionaryResultsDialogProps) {

  // Helper functions
  const toggleItemSelection = (id: string) => {
    setSelectedItems({
      ...selectedItems,
      [id]: !selectedItems[id]
    });
  }

  const selectAllInGroup = (groupItems: { id: string; term: string }[], select: boolean) => {
    const newSelectedItems = { ...selectedItems };
    groupItems.forEach(item => {
      newSelectedItems[item.id] = select;
    });
    setSelectedItems(newSelectedItems);
  }

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

  const areAllSelectedInGroup = (groupItems: { id: string; term: string }[]) => {
    return groupItems.every(item => selectedItems[item.id]);
  }

  const countSelectedInGroup = (groupItems: { id: string; term: string }[]) => {
    return groupItems.filter(item => selectedItems[item.id]).length;
  }

  // Handle dialog close with refresh
  const handleClose = async () => {
    onOpenChange(false);
    await refreshDictionary();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleClose();
      }
    }}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI 概念词典优化结果</DialogTitle>
          <DialogDescription>
            AI 分析了您的概念词典，以下是发现的问题和优化建议
          </DialogDescription>
        </DialogHeader>

        {analysisResults && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium mb-2">整体分析</h4>
              <p className="text-sm">{analysisResults.analysis}</p>
            </div>

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
                  onClick={onMergeAllConcepts}
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
                          onClick={() => onMergeConcepts('duplicates', idx)}
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
                              checked={selectedItems[item.id]}
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
                          onClick={() => onMergeConcepts('mergeSuggestions', idx)}
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
                        {suggestion.mergedTerm.relatedTerms && suggestion.mergedTerm.relatedTerms.length > 0 && (
                          <p>关联术语ID：{suggestion.mergedTerm.relatedTerms.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Related Terms Analysis */}
            {analysisResults.relatedTerms && analysisResults.relatedTerms.length > 0 && (
              <div>
                <h4 className="font-medium flex items-center mb-2">
                  <BookOpen className="h-4 w-4 text-purple-500 mr-2" />
                  识别到的关联术语 ({analysisResults.relatedTerms.length})
                </h4>
                <div className="space-y-3">
                  {analysisResults.relatedTerms.map((related, idx) => (
                    <div key={`rel-${idx}`} className="p-3 border rounded-md bg-purple-50 text-sm">
                      <p><span className="font-medium">术语ID：</span>{related.termId}</p>
                      <p><span className="font-medium">关联ID：</span>{related.relatedTermIds.join(', ')}</p>
                      <p><span className="font-medium">关系类型：</span>{related.relationshipType}</p>
                      <p><span className="font-medium">原因：</span>{related.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 无问题情况 */}
            {analysisResults.duplicates.length === 0 &&
              analysisResults.mergeSuggestions.length === 0 &&
              (!analysisResults.relatedTerms || analysisResults.relatedTerms.length === 0) && (
                <div className="text-center p-4">
                  <p className="text-green-600">您的概念词典没有检测到重复或需要合并的概念。</p>
                </div>
              )}
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
