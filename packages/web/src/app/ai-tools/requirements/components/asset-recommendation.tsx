"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, FileText, Code, BookOpen, Loader2 } from "lucide-react"
import { ApiResource, CodeAnalysis, Guideline } from "@/types/project.type"
import { useAssetData } from '../hooks/use-asset-data'

interface AssetRecommendationProps {
  keywords: string[]
  selectedAPIs: string[]
  selectedCodeSnippets: string[]
  selectedStandards: string[]
  onSelectAPI: (apiId: string) => void
  onSelectCodeSnippet: (snippetId: string) => void
  onSelectStandard: (standardId: string) => void
  onConfirm: () => void
  onSkip?: () => void
  onSelectAPIObjects?: (apis: ApiResource[]) => void
  onSelectCodeSnippetObjects?: (codeSnippets: CodeAnalysis[]) => void
  onSelectStandardObjects?: (guidelines: Guideline[]) => void
}

interface CategoryControlsProps {
  count: number
  onSelectAll: () => void
  onDeselectAll: () => void
}

const CategoryControls: React.FC<CategoryControlsProps> = ({ count, onSelectAll, onDeselectAll }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm text-muted-foreground">({count} items)</span>
    <Button variant="ghost" size="sm" onClick={onSelectAll}>
      Select All
    </Button>
    <Button variant="ghost" size="sm" onClick={onDeselectAll}>
      Deselect All
    </Button>
  </div>
)

interface ResourceSectionProps<T extends { id: string }> {
  title: string
  icon: React.ReactNode
  description: string
  data: T[]
  isLoading: boolean
  error: string | null
  selectedIds: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  renderItem: (item: T) => React.ReactNode
}

function ResourceSection<T extends { id: string }>({
  title,
  icon,
  description,
  data,
  isLoading,
  error,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  renderItem,
}: ResourceSectionProps<T>) {
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {!isLoading && data.length > 0 && (
            <CategoryControls
              count={data.length}
              onSelectAll={onSelectAll}
              onDeselectAll={onDeselectAll}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading {title.toLowerCase()}...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No {title.toLowerCase()} found for the current keywords.
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                <Checkbox
                  id={item.id}
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={() => onToggle(item.id)}
                />
                <div className="flex-1">
                  {renderItem(item)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AssetRecommendation({
  keywords,
  selectedAPIs,
  selectedCodeSnippets,
  selectedStandards,
  onSelectAPI,
  onSelectCodeSnippet,
  onSelectStandard,
  onConfirm,
  onSkip,
  onSelectAPIObjects,
  onSelectCodeSnippetObjects,
  onSelectStandardObjects,
}: AssetRecommendationProps) {
  const {
    apis,
    codeSnippets,
    guidelines,
    selectedCount,
    selectAllAPIs,
    deselectAllAPIs,
    selectAllCodeSnippets,
    deselectAllCodeSnippets,
    selectAllGuidelines,
    deselectAllGuidelines,
    handleConfirm,
  } = useAssetData({
    keywords,
    selectedAPIs,
    selectedCodeSnippets,
    selectedStandards,
    onSelectAPI,
    onSelectCodeSnippet,
    onSelectStandard,
    onSelectAPIObjects,
    onSelectCodeSnippetObjects,
    onSelectStandardObjects,
  })

  const renderAPIItem = (api: ApiResource) => (
    <div className="space-y-2">
      <div className="font-medium">{api.methodName}</div>
      <div className="text-sm text-muted-foreground">
        {api.className} • {api.packageName}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="secondary" className="text-xs">
          {api.sourceHttpMethod?.toUpperCase() || 'API'}
        </Badge>
        {api.sourceUrl && (
          <code className="text-xs bg-muted px-1 py-0.5 rounded">{api.sourceUrl}</code>
        )}
      </div>
    </div>
  )

  const renderCodeSnippetItem = (snippet: CodeAnalysis) => (
    <div className="space-y-2">
      <div className="font-medium">{snippet.title || 'Code Snippet'}</div>
      {snippet.description && (
        <div className="text-sm text-muted-foreground">{snippet.description}</div>
      )}
      {snippet.language && (
        <Badge variant="outline" className="text-xs mt-1">
          {snippet.language}
        </Badge>
      )}
      {snippet.path && (
        <div className="text-xs text-muted-foreground mt-1">{snippet.path}</div>
      )}
    </div>
  )

  const renderGuidelineItem = (guideline: Guideline) => (
    <div className="space-y-2">
      <div className="font-medium">{guideline.title}</div>
      {guideline.description && (
        <div className="text-sm text-muted-foreground mt-1">{guideline.description}</div>
      )}
      <div className="flex items-center gap-2 mt-2">
        {guideline.category && (
          <Badge variant="secondary" className="text-xs">
            {String(guideline.category)}
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {guideline.language}
        </Badge>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Asset Recommendations</h2>
        <p className="text-muted-foreground mt-2">
          Based on your keywords: <strong>{keywords.join(', ')}</strong>
        </p>
      </div>

      <div className="space-y-6">
        <ResourceSection
          title="API Resources"
          icon={<FileText className="h-5 w-5" />}
          description="Recommended APIs based on your requirements"
          data={apis.data}
          isLoading={apis.isLoading}
          error={apis.error}
          selectedIds={selectedAPIs}
          onToggle={onSelectAPI}
          onSelectAll={selectAllAPIs}
          onDeselectAll={deselectAllAPIs}
          renderItem={renderAPIItem}
        />

        <ResourceSection
          title="Code Snippets"
          icon={<Code className="h-5 w-5" />}
          description="Relevant code examples and implementations"
          data={codeSnippets.data}
          isLoading={codeSnippets.isLoading}
          error={codeSnippets.error}
          selectedIds={selectedCodeSnippets}
          onToggle={onSelectCodeSnippet}
          onSelectAll={selectAllCodeSnippets}
          onDeselectAll={deselectAllCodeSnippets}
          renderItem={renderCodeSnippetItem}
        />

        <ResourceSection
          title="Standards & Guidelines"
          icon={<BookOpen className="h-5 w-5" />}
          description="Best practices and coding standards"
          data={guidelines.data}
          isLoading={guidelines.isLoading}
          error={guidelines.error}
          selectedIds={selectedStandards}
          onToggle={onSelectStandard}
          onSelectAll={selectAllGuidelines}
          onDeselectAll={deselectAllGuidelines}
          renderItem={renderGuidelineItem}
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Selected {selectedCount} items total
          </p>
        </div>
        <div className="flex gap-3">
          {onSkip && (
            <Button variant="outline" onClick={onSkip}>
              Skip
            </Button>
          )}
          <Button onClick={() => handleConfirm(onConfirm)}>
            Confirm Selection
          </Button>
        </div>
      </div>
    </div>
  )
}