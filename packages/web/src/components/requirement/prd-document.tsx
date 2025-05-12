"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RefreshCw, Loader2, FileText, BookOpen, TestTube2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PrdDocumentProps {
  prd: {
    overview: {
      title: string
      description: string
      objectives: string[]
    }
    userStories: string[]
    functionalRequirements: string[]
    nonFunctionalRequirements: string[]
    technicalSpecifications: {
      architecture: string
      dataModel: string
      integrations: string[]
    }
    uiUxConsiderations: string[]
    timeline: {
      phases: {
        name: string
        duration: string
        deliverables: string[]
      }[]
    }
  }
  onRegenerate: () => Promise<void>
  onGenerateUserStories: () => Promise<void>
  onGenerateTestCases: () => Promise<void>
  onBack: () => void
  isProcessing: boolean
}

export default function PrdDocument({
  prd,
  onRegenerate,
  onGenerateUserStories,
  onGenerateTestCases,
  onBack,
  isProcessing,
}: PrdDocumentProps) {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2 text-emerald-500" />
          Product Requirements Document (PRD)
        </CardTitle>
        <CardDescription>Complete PRD based on your requirements and epics</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-7 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="userStories">User Stories</TabsTrigger>
            <TabsTrigger value="functional">Functional</TabsTrigger>
            <TabsTrigger value="nonFunctional">Non-Functional</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="uiux">UI/UX</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              <h3 className="text-xl font-semibold mb-3">{prd.overview.title}</h3>
              <p className="mb-4 text-gray-700 dark:text-gray-300">{prd.overview.description}</p>

              <h4 className="font-medium mb-2">Key Objectives:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {prd.overview.objectives.map((objective, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-300">
                    {objective}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="userStories">
            <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              <h3 className="text-xl font-semibold mb-3">User Stories</h3>
              <ul className="list-disc pl-5 space-y-2">
                {prd.userStories.map((story, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-300">
                    {story}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="functional">
            <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              <h3 className="text-xl font-semibold mb-3">Functional Requirements</h3>
              <ul className="list-disc pl-5 space-y-2">
                {prd.functionalRequirements.map((req, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-300">
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="nonFunctional">
            <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              <h3 className="text-xl font-semibold mb-3">Non-Functional Requirements</h3>
              <ul className="list-disc pl-5 space-y-2">
                {prd.nonFunctionalRequirements.map((req, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-300">
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="technical">
            <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              <h3 className="text-xl font-semibold mb-3">Technical Specifications</h3>

              <h4 className="font-medium mb-2">Architecture:</h4>
              <p className="mb-4 text-gray-700 dark:text-gray-300">{prd.technicalSpecifications.architecture}</p>

              <h4 className="font-medium mb-2">Data Model:</h4>
              <p className="mb-4 text-gray-700 dark:text-gray-300">{prd.technicalSpecifications.dataModel}</p>

              <h4 className="font-medium mb-2">Integrations:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {prd.technicalSpecifications.integrations.map((integration, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-300">
                    {integration}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="uiux">
            <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              <h3 className="text-xl font-semibold mb-3">UI/UX Considerations</h3>
              <ul className="list-disc pl-5 space-y-2">
                {prd.uiUxConsiderations.map((consideration, index) => (
                  <li key={index} className="text-gray-700 dark:text-gray-300">
                    {consideration}
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              <h3 className="text-xl font-semibold mb-3">Project Timeline</h3>

              {prd.timeline.phases.map((phase, phaseIndex) => (
                <div key={phaseIndex} className="mb-4">
                  <h4 className="font-medium mb-1">
                    {phase.name} <span className="text-sm font-normal text-gray-500">({phase.duration})</span>
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {phase.deliverables.map((deliverable, index) => (
                      <li key={index} className="text-gray-700 dark:text-gray-300">
                        {deliverable}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Epics
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={onRegenerate} disabled={isProcessing} className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate PRD
          </Button>
          <Button
            onClick={onGenerateUserStories}
            disabled={isProcessing}
            className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
          >
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookOpen className="mr-2 h-4 w-4" />}
            Generate User Stories
          </Button>
          <Button
            onClick={onGenerateTestCases}
            disabled={isProcessing}
            className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
          >
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TestTube2 className="mr-2 h-4 w-4" />}
            Generate Test Cases
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
