"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RefreshCw, ListTodo } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface EpicsListProps {
  enhancedRequirement: string
  epics: string[]
  onRegenerate: () => Promise<void>
  onBack: () => void
  isProcessing: boolean
}

export default function EpicsList({
  enhancedRequirement,
  epics,
  onRegenerate,
  onBack,
  isProcessing,
}: EpicsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ListTodo className="h-5 w-5 mr-2 text-emerald-500" />
          Epic-Level Requirements
        </CardTitle>
        <CardDescription>We&#39;ve broken down your requirement into high-level epics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Based on:</h3>
          <p className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300">
            {enhancedRequirement}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Epic-Level Requirements:</h3>
          <ul className="space-y-3">
            {epics.map((epic, index) => (
              <li key={index} className="flex items-start">
                <Badge className="mt-0.5 mr-2 bg-emerald-600">{index + 1}</Badge>
                <div className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md flex-1">
                  {epic}
                </div>
              </li>
            ))}
          </ul>
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
        </div>
      </CardFooter>
    </Card>
  )
}
