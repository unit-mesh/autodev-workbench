"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ExternalLink, FileText, MessageSquare } from "lucide-react"

interface KnowledgePanelProps {
  concept: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[]
  isLoading: boolean
}

export function KnowledgePanel({ concept, items, isLoading }: KnowledgePanelProps) {
  if (!concept) {
    return (
      <div className="border rounded-md p-4 bg-muted/40 text-center text-muted-foreground">
        Select a concept to view related knowledge items.
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No results for &#34;{concept}&#34;</CardTitle>
          <CardDescription>No knowledge items found for this concept.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const jiraItems = items.filter((item) => item.type === "jira")
  const confluenceItems = items.filter((item) => item.type === "confluence")

  return (
    <Tabs defaultValue="all">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="all">All ({items.length})</TabsTrigger>
        <TabsTrigger value="jira">Jira ({jiraItems.length})</TabsTrigger>
        <TabsTrigger value="confluence">Confluence ({confluenceItems.length})</TabsTrigger>
      </TabsList>

      <ScrollArea className="h-[300px] mt-2">
        <TabsContent value="all" className="space-y-4 mt-0">
          {items.map((item) => (
            <KnowledgeItem key={item.id} item={item} />
          ))}
        </TabsContent>

        <TabsContent value="jira" className="space-y-4 mt-0">
          {jiraItems.map((item) => (
            <KnowledgeItem key={item.id} item={item} />
          ))}
        </TabsContent>

        <TabsContent value="confluence" className="space-y-4 mt-0">
          {confluenceItems.map((item) => (
            <KnowledgeItem key={item.id} item={item} />
          ))}
        </TabsContent>
      </ScrollArea>
    </Tabs>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function KnowledgeItem({ item }: { item: any }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {item.type === "jira" ? (
              <MessageSquare className="h-4 w-4 text-blue-500" />
            ) : (
              <FileText className="h-4 w-4 text-teal-500" />
            )}
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
          </div>
          <a href="#" className="text-muted-foreground hover:text-foreground" onClick={(e) => e.preventDefault()}>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <CardDescription className="text-xs">
          {item.type === "jira" ? `${item.key} · ${item.status}` : `Updated ${item.updated}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{item.description}</p>
      </CardContent>
    </Card>
  )
}
