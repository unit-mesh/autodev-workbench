"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, RefreshCw, Loader2, Sparkles } from "lucide-react"

interface EnhancedRequirementProps {
  originalRequirement: string
  enhancedRequirement: string
  onRegenerate: () => Promise<void>
  onContinue: () => Promise<void>
  onBack: () => void
  isProcessing: boolean
}

export default function EnhancedRequirement({
  originalRequirement,
  enhancedRequirement,
  onRegenerate,
  onContinue,
  onBack,
  isProcessing,
}: EnhancedRequirementProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-emerald-500" />
          Enhanced Requirement
        </CardTitle>
        <CardDescription>We&#39;ve enhanced your requirement with additional details and clarity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Original Input:</h3>
          <p className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300">
            {originalRequirement}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Enhanced Requirement:</h3>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md text-slate-800 dark:text-slate-200">
            {enhancedRequirement}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRegenerate} disabled={isProcessing}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
          <Button onClick={onContinue} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Epics...
              </>
            ) : (
              <>
                Generate Epics
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
