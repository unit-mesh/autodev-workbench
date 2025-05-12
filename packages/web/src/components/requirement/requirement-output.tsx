import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"

interface RequirementOutputProps {
  specification: {
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
}

export default function RequirementOutput({ specification }: RequirementOutputProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
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
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-3">{specification.overview.title}</h3>
          <p className="mb-4 text-gray-700 dark:text-gray-300">{specification.overview.description}</p>

          <h4 className="font-medium mb-2">Key Objectives:</h4>
          <ul className="list-disc pl-5 space-y-1">
            {specification.overview.objectives.map((objective, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">
                {objective}
              </li>
            ))}
          </ul>
        </Card>
      </TabsContent>

      <TabsContent value="userStories">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-3">User Stories</h3>
          <ul className="list-disc pl-5 space-y-2">
            {specification.userStories.map((story, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">
                {story}
              </li>
            ))}
          </ul>
        </Card>
      </TabsContent>

      <TabsContent value="functional">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-3">Functional Requirements</h3>
          <ul className="list-disc pl-5 space-y-2">
            {specification.functionalRequirements.map((req, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">
                {req}
              </li>
            ))}
          </ul>
        </Card>
      </TabsContent>

      <TabsContent value="nonFunctional">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-3">Non-Functional Requirements</h3>
          <ul className="list-disc pl-5 space-y-2">
            {specification.nonFunctionalRequirements.map((req, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">
                {req}
              </li>
            ))}
          </ul>
        </Card>
      </TabsContent>

      <TabsContent value="technical">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-3">Technical Specifications</h3>

          <h4 className="font-medium mb-2">Architecture:</h4>
          <p className="mb-4 text-gray-700 dark:text-gray-300">{specification.technicalSpecifications.architecture}</p>

          <h4 className="font-medium mb-2">Data Model:</h4>
          <p className="mb-4 text-gray-700 dark:text-gray-300">{specification.technicalSpecifications.dataModel}</p>

          <h4 className="font-medium mb-2">Integrations:</h4>
          <ul className="list-disc pl-5 space-y-1">
            {specification.technicalSpecifications.integrations.map((integration, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">
                {integration}
              </li>
            ))}
          </ul>
        </Card>
      </TabsContent>

      <TabsContent value="uiux">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-3">UI/UX Considerations</h3>
          <ul className="list-disc pl-5 space-y-2">
            {specification.uiUxConsiderations.map((consideration, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">
                {consideration}
              </li>
            ))}
          </ul>
        </Card>
      </TabsContent>

      <TabsContent value="timeline">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-3">Project Timeline</h3>

          {specification.timeline.phases.map((phase, phaseIndex) => (
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
        </Card>
      </TabsContent>
    </Tabs>
  )
}
