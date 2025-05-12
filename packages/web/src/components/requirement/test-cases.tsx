"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RefreshCw, Loader2, BookOpen, TestTube2, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TestCase {
  id: string
  title: string
  description: string
  preconditions: string[]
  steps: string[]
  expectedResults: string[]
  priority: "High" | "Medium" | "Low"
}

interface TestCasesProps {
  testCases: TestCase[]
  onRegenerate: () => Promise<void>
  onGenerateUserStories: () => Promise<void>
  onBack: () => void
  isProcessing: boolean
}

export default function TestCases({
  testCases,
  onRegenerate,
  onGenerateUserStories,
  onBack,
  isProcessing,
}: TestCasesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TestTube2 className="h-5 w-5 mr-2 text-emerald-500" />
          Test Cases
        </CardTitle>
        <CardDescription>Comprehensive test cases based on your requirements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {testCases.map((testCase, index) => (
            <div
              key={index}
              className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium">{testCase.title}</h3>
                <Badge
                  className={
                    testCase.priority === "High"
                      ? "bg-red-500"
                      : testCase.priority === "Medium"
                        ? "bg-amber-500"
                        : "bg-blue-500"
                  }
                >
                  {testCase.priority}
                </Badge>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-3">{testCase.description}</p>

              <div className="mb-3">
                <h4 className="text-sm font-medium mb-1">Preconditions:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {testCase.preconditions.map((condition, idx) => (
                    <li key={idx} className="text-gray-700 dark:text-gray-300 text-sm">
                      {condition}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-3">
                <h4 className="text-sm font-medium mb-1">Steps:</h4>
                <ol className="list-decimal pl-5 space-y-1">
                  {testCase.steps.map((step, idx) => (
                    <li key={idx} className="text-gray-700 dark:text-gray-300 text-sm">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">Expected Results:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {testCase.expectedResults.map((result, idx) => (
                    <li key={idx} className="text-gray-700 dark:text-gray-300 text-sm">
                      {result}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to PRD
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={onRegenerate} disabled={isProcessing} className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
          <Button
            onClick={onGenerateUserStories}
            disabled={isProcessing}
            className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
          >
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
            Generate User Stories
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
