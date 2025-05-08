"use client"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface ConceptListProps {
  concepts: string[]
  validConcepts: string[]
  invalidConcepts: { term: string; reason: string }[]
  selectedConcept: string | null
  onSelectConcept: (concept: string) => void
  isValidating: boolean
}

export function ConceptList({
  concepts,
  validConcepts,
  invalidConcepts,
  selectedConcept,
  onSelectConcept,
  isValidating,
}: ConceptListProps) {
  if (concepts.length === 0) {
    return (
      <div className="border rounded-md p-4 bg-muted/40 text-center text-muted-foreground">
        No concepts extracted yet. Click "Extract Concepts" to analyze the code.
      </div>
    )
  }

  if (isValidating) {
    return (
      <div className="border rounded-md p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <span>AI is validating concepts...</span>
        </div>
      </div>
    )
  }

  const invalidTerms = invalidConcepts.map((item) => item.term)

  return (
    <TooltipProvider>
      <Tabs defaultValue="valid">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All ({concepts.length})</TabsTrigger>
          <TabsTrigger value="valid">Valid ({validConcepts.length})</TabsTrigger>
          <TabsTrigger value="invalid">Invalid ({invalidConcepts.length})</TabsTrigger>
        </TabsList>

        <ScrollArea className="border rounded-md h-[200px] mt-2">
          <TabsContent value="all" className="p-2 m-0">
            <div className="flex flex-wrap gap-2">
              {concepts.map((concept) => {
                const isInvalid = invalidTerms.includes(concept)
                const invalidInfo = invalidConcepts.find((item) => item.term === concept)

                return (
                  <Tooltip key={concept}>
                    <TooltipTrigger asChild>
                      <Badge
                        variant={selectedConcept === concept ? "default" : "outline"}
                        className={`cursor-pointer hover:bg-primary/10 ${
                          isInvalid ? "border-yellow-500 text-yellow-700" : ""
                        }`}
                        onClick={() => onSelectConcept(concept)}
                      >
                        {concept}
                        {isInvalid && <AlertCircle className="ml-1 h-3 w-3 text-yellow-500" />}
                        {validConcepts.includes(concept) && <CheckCircle2 className="ml-1 h-3 w-3 text-green-500" />}
                      </Badge>
                    </TooltipTrigger>
                    {isInvalid && (
                      <TooltipContent side="bottom">
                        <p className="max-w-xs">{invalidInfo?.reason}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="valid" className="p-2 m-0">
            <div className="flex flex-wrap gap-2">
              {validConcepts.map((concept) => (
                <Badge
                  key={concept}
                  variant={selectedConcept === concept ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => onSelectConcept(concept)}
                >
                  {concept}
                  <CheckCircle2 className="ml-1 h-3 w-3 text-green-500" />
                </Badge>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="invalid" className="p-2 m-0">
            <div className="flex flex-wrap gap-2">
              {invalidConcepts.map(({ term, reason }) => (
                <Tooltip key={term}>
                  <TooltipTrigger asChild>
                    <Badge
                      variant={selectedConcept === term ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10 border-yellow-500 text-yellow-700"
                      onClick={() => onSelectConcept(term)}
                    >
                      {term}
                      <AlertCircle className="ml-1 h-3 w-3 text-yellow-500" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="max-w-xs">{reason}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </TooltipProvider>
  )
}
