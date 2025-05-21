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
  const isTermMatching = (term: ConceptDictionary) => {
    if (extractedKeywords.length === 0) return { isMatch: false, matches: [] };

    const matches = extractedKeywords.filter(keyword =>
      term.termChinese.toLowerCase().includes(keyword.toLowerCase()) ||
      term.termEnglish.toLowerCase().includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(term.termChinese.toLowerCase()) ||
      keyword.toLowerCase().includes(term.termEnglish.toLowerCase())
    );

    return {
      isMatch: matches.length > 0,
      matches,
      isAiVerified: matches.some(keyword =>
        aiVerifiedMatches.includes(keyword) && validationResults?.success
      )
    };
  };

  return (
    <div className="border-t border-gray-200 p-2">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-xs font-medium text-gray-700">项目词汇表</h3>
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
          <Plus className="h-3 w-3"/>
        </Button>
      </div>
      <ScrollArea className="h-40">
        {isLoadingGlossary ? (
          <div className="flex justify-center items-center h-12">
            <Loader2 className="h-3 w-3 animate-spin text-gray-400"/>
          </div>
        ) : glossaryError ? (
          <div className="text-xs text-red-500 p-1">
            错误: {glossaryError}
          </div>
        ) : glossaryTerms.length === 0 ? (
          <div className="text-xs text-gray-500 p-1">
            暂无词汇表数据
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-100">
                <th className="font-medium text-left py-0.5 pl-1 w-[45%]">中文</th>
                <th className="font-medium text-left py-0.5 w-[45%]">英文</th>
                <th className="w-[10%]"></th>
              </tr>
            </thead>
            <tbody>
              {glossaryTerms.map((item) => {
                const { isMatch, matches, isAiVerified } = isTermMatching(item);

                return (
                  <TooltipProvider key={item.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <tr className="cursor-pointer hover:bg-gray-50">
                          <td className="py-0.5 pl-1 truncate font-medium">{item.termChinese}</td>
                          <td className="py-0.5 truncate text-gray-500">{item.termEnglish}</td>
                          <td className="text-center">
                            {isAiVerified ? (
                              <AlertCircle className="h-2.5 w-2.5 inline-block text-purple-600"/>
                            ) : isMatch ? (
                              <Check className="h-2.5 w-2.5 inline-block text-green-600"/>
                            ) : null}
                          </td>
                        </tr>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs max-w-52">
                          <p className="font-medium">{item.descChinese}</p>
                          {isMatch && (
                            <>
                              <p className={`text-xs mt-1 ${isAiVerified ? "text-purple-700" : "text-green-700"}`}>
                                {isAiVerified ? "AI验证匹配:" : "匹配:"}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {matches.map((keyword, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className={`text-[10px] py-0 px-1 ${
                                      aiVerifiedMatches.includes(keyword) && validationResults?.success
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-green-50 text-green-700 border-green-200"
                                    }`}
                                  >
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </tbody>
          </table>
        )}
      </ScrollArea>
    </div>
  )
}
