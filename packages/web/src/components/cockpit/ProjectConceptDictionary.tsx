"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2, Check, AlertCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ConceptDictionary {
  id: string
  termChinese: string
  termEnglish: string
  descChinese: string
  descEnglish: string
  projectId: string | null
  createdAt: string
  updatedAt: string
}

interface ProjectGlossaryProps {
  glossaryTerms: ConceptDictionary[]
  isLoadingGlossary: boolean
  glossaryError: string | null
  extractedKeywords: string[]
  aiVerifiedMatches: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validationResults: any
}

export default function ProjectConceptDictionary({
  glossaryTerms,
  isLoadingGlossary,
  glossaryError,
  extractedKeywords,
  aiVerifiedMatches,
  validationResults
}: ProjectGlossaryProps) {
  const isTermMatchingAnyKeyword = (term: ConceptDictionary) => {
    if (extractedKeywords.length === 0) return false;

    return extractedKeywords.some(keyword =>
      term.termChinese.toLowerCase().includes(keyword.toLowerCase()) ||
      term.termEnglish.toLowerCase().includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(term.termChinese.toLowerCase()) ||
      keyword.toLowerCase().includes(term.termEnglish.toLowerCase())
    );
  };

  const getMatchingKeywordsForTerm = (term: ConceptDictionary) => {
    return extractedKeywords.filter(keyword =>
      term.termChinese.toLowerCase().includes(keyword.toLowerCase()) ||
      term.termEnglish.toLowerCase().includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(term.termChinese.toLowerCase()) ||
      keyword.toLowerCase().includes(term.termEnglish.toLowerCase())
    );
  };

  const isKeywordAiVerified = (keyword: string) => {
    return aiVerifiedMatches.includes(keyword) && validationResults?.success;
  };

  return (
    <div className="border-t border-gray-200 p-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700">项目词汇表</h3>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Plus className="h-3 w-3"/>
        </Button>
      </div>
      <ScrollArea className="h-48">
        {isLoadingGlossary ? (
          <div className="flex justify-center items-center h-20">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400"/>
          </div>
        ) : glossaryError ? (
          <div className="text-xs text-red-500 p-2">
            获取词汇表出错: {glossaryError}
          </div>
        ) : glossaryTerms.length === 0 ? (
          <div className="text-xs text-gray-500 p-2">
            暂无词汇表数据
          </div>
        ) : (
          <div className="space-y-1">
            {glossaryTerms.map((item) => {
              const isMatched = isTermMatchingAnyKeyword(item);
              const matchingKeywords = isMatched ? getMatchingKeywordsForTerm(item) : [];

              const isAiVerified = matchingKeywords.some(keyword => isKeywordAiVerified(keyword));

              return (
                <TooltipProvider key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`text-xs p-1.5 rounded-md ${
                          isAiVerified
                            ? "bg-purple-50 border border-purple-100"
                            : isMatched
                              ? "bg-green-50 border border-green-100"
                              : ""
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className={`font-medium ${
                            isAiVerified
                              ? "text-purple-800"
                              : isMatched
                                ? "text-green-800"
                                : "text-gray-800"
                          }`}>
                            {item.termChinese}
                          </span>
                          <span className="text-gray-400">({item.termEnglish})</span>
                          {isAiVerified ? (
                            <AlertCircle className="h-3 w-3 text-purple-600"/>
                          ) : isMatched ? (
                            <Check className="h-3 w-3 text-green-600"/>
                          ) : null}
                          <span className="text-gray-500"> - {item.descChinese}</span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    {(isMatched || isAiVerified) && (
                      <TooltipContent>
                        <div className="text-xs max-w-60">
                          <p className={`font-medium ${isAiVerified ? "text-purple-800" : ""}`}>
                            {isAiVerified ? "AI验证匹配的关键词:" : "匹配关键词:"}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {matchingKeywords.map((keyword, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className={isKeywordAiVerified(keyword)
                                  ? "bg-purple-50 text-purple-800 border-purple-300"
                                  : "bg-green-50 text-green-800 border-green-300"
                                }
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
