"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RefreshCw, Loader2, BookOpen, TestTube2, Download } from "lucide-react"

interface UserStoriesProps {
  userStories: string[]
  onRegenerate: () => Promise<void>
  onGenerateTestCases: () => Promise<void>
  onBack: () => void
  isProcessing: boolean
}

export default function UserStories({
  userStories,
  onRegenerate,
  onGenerateTestCases,
  onBack,
  isProcessing,
}: UserStoriesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-emerald-500" />
          User Stories
        </CardTitle>
        <CardDescription>Detailed user stories based on your requirements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userStories.map((story, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md"
              >
                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                  Story #{index + 1}
                </div>
                <p className="text-gray-700 dark:text-gray-300">{story}</p>
              </div>
            ))}
          </div>
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
            onClick={onGenerateTestCases}
            disabled={isProcessing}
            className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
          >
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TestTube2 className="mr-2 h-4 w-4" />}
            Generate Test Cases
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
