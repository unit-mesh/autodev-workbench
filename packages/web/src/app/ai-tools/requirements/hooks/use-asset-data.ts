import { useState, useEffect, useCallback, useMemo } from 'react'
import { ApiResource, CodeAnalysis, Guideline } from '@/types/project.type'

interface ResourceState<T> {
  data: T[]
  isLoading: boolean
  error: string | null
}

interface UseAssetDataProps {
  keywords: string[]
  selectedAPIs: string[]
  selectedCodeSnippets: string[]
  selectedStandards: string[]
  onSelectAPI: (apiId: string) => void
  onSelectCodeSnippet: (snippetId: string) => void
  onSelectStandard: (standardId: string) => void
  onSelectAPIObjects?: (apis: ApiResource[]) => void
  onSelectCodeSnippetObjects?: (codeSnippets: CodeAnalysis[]) => void
  onSelectStandardObjects?: (guidelines: Guideline[]) => void
}

export function useAssetData({
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
}: UseAssetDataProps) {
  const [apis, setApis] = useState<ResourceState<ApiResource>>({
    data: [],
    isLoading: false,
    error: null,
  })

  const [codeSnippets, setCodeSnippets] = useState<ResourceState<CodeAnalysis>>({
    data: [],
    isLoading: false,
    error: null,
  })

  const [guidelines, setGuidelines] = useState<ResourceState<Guideline>>({
    data: [],
    isLoading: false,
    error: null,
  })

  const keywordsParam = useMemo(
    () => keywords && keywords.length > 0 ? `keywords=${keywords.join(',')}` : '',
    [keywords]
  )

  // 通用的数据获取函数
  const fetchData = useCallback(async <T>(
    endpoint: string,
    setter: React.Dispatch<React.SetStateAction<ResourceState<T>>>,
    resourceType: string
  ) => {
    setter(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await fetch(`${endpoint}${keywordsParam ? `?${keywordsParam}` : ''}`)
      if (!response.ok) throw new Error(`Failed to fetch ${resourceType}: ${response.status}`)
      const data = await response.json()
      setter(prev => ({ ...prev, data, isLoading: false }))
    } catch (error) {
      setter(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        isLoading: false,
      }))
    }
  }, [keywordsParam])

  // 获取API数据
  useEffect(() => {
    fetchData('/api/context/api', setApis, 'APIs')
  }, [fetchData])

  // 获取代码片段数据
  useEffect(() => {
    fetchData('/api/context/code', setCodeSnippets, 'code snippets')
  }, [fetchData])

  // 获取指南数据
  useEffect(() => {
    fetchData('/api/guideline', setGuidelines, 'guidelines')
  }, [fetchData])

  // 自动选择逻辑
  useEffect(() => {
    if (!apis.isLoading && apis.data.length > 0 && selectedAPIs.length === 0) {
      apis.data.forEach(api => onSelectAPI(api.id))
      onSelectAPIObjects?.(apis.data)
    }
  }, [apis.data, apis.isLoading, selectedAPIs.length, onSelectAPI, onSelectAPIObjects])

  useEffect(() => {
    if (!codeSnippets.isLoading && codeSnippets.data.length > 0 && selectedCodeSnippets.length === 0) {
      codeSnippets.data.forEach(snippet => onSelectCodeSnippet(snippet.id))
      onSelectCodeSnippetObjects?.(codeSnippets.data)
    }
  }, [codeSnippets.data, codeSnippets.isLoading, selectedCodeSnippets.length, onSelectCodeSnippet, onSelectCodeSnippetObjects])

  useEffect(() => {
    if (!guidelines.isLoading && guidelines.data.length > 0 && selectedStandards.length === 0) {
      guidelines.data.forEach(guideline => onSelectStandard(guideline.id))
      onSelectStandardObjects?.(guidelines.data)
    }
  }, [guidelines.data, guidelines.isLoading, selectedStandards.length, onSelectStandard, onSelectStandardObjects])

  // 选择操作函数
  const selectAllAPIs = useCallback(() => {
    apis.data.forEach(api => {
      if (!selectedAPIs.includes(api.id)) {
        onSelectAPI(api.id)
      }
    })
    onSelectAPIObjects?.(apis.data)
  }, [apis.data, selectedAPIs, onSelectAPI, onSelectAPIObjects])

  const deselectAllAPIs = useCallback(() => {
    selectedAPIs.forEach(apiId => onSelectAPI(apiId))
    onSelectAPIObjects?.([])
  }, [selectedAPIs, onSelectAPI, onSelectAPIObjects])

  const selectAllCodeSnippets = useCallback(() => {
    codeSnippets.data.forEach(snippet => {
      if (!selectedCodeSnippets.includes(snippet.id)) {
        onSelectCodeSnippet(snippet.id)
      }
    })
    onSelectCodeSnippetObjects?.(codeSnippets.data)
  }, [codeSnippets.data, selectedCodeSnippets, onSelectCodeSnippet, onSelectCodeSnippetObjects])

  const deselectAllCodeSnippets = useCallback(() => {
    selectedCodeSnippets.forEach(snippetId => onSelectCodeSnippet(snippetId))
    onSelectCodeSnippetObjects?.([])
  }, [selectedCodeSnippets, onSelectCodeSnippet, onSelectCodeSnippetObjects])

  const selectAllGuidelines = useCallback(() => {
    guidelines.data.forEach(guideline => {
      if (!selectedStandards.includes(guideline.id)) {
        onSelectStandard(guideline.id)
      }
    })
    onSelectStandardObjects?.(guidelines.data)
  }, [guidelines.data, selectedStandards, onSelectStandard, onSelectStandardObjects])

  const deselectAllGuidelines = useCallback(() => {
    selectedStandards.forEach(standardId => onSelectStandard(standardId))
    onSelectStandardObjects?.([])
  }, [selectedStandards, onSelectStandard, onSelectStandardObjects])

  // 确认处理函数
  const handleConfirm = useCallback((onConfirm: () => void) => {
    if (onSelectAPIObjects) {
      const selectedApiObjects = apis.data.filter(api => selectedAPIs.includes(api.id))
      onSelectAPIObjects(selectedApiObjects)
    }

    if (onSelectCodeSnippetObjects) {
      const selectedCodeObjects = codeSnippets.data.filter(snippet => selectedCodeSnippets.includes(snippet.id))
      onSelectCodeSnippetObjects(selectedCodeObjects)
    }

    if (onSelectStandardObjects) {
      const selectedGuidelineObjects = guidelines.data.filter(guideline => selectedStandards.includes(guideline.id))
      onSelectStandardObjects(selectedGuidelineObjects)
    }

    onConfirm()
  }, [
    apis.data,
    codeSnippets.data,
    guidelines.data,
    selectedAPIs,
    selectedCodeSnippets,
    selectedStandards,
    onSelectAPIObjects,
    onSelectCodeSnippetObjects,
    onSelectStandardObjects,
  ])

  const selectedCount = useMemo(
    () => selectedAPIs.length + selectedCodeSnippets.length + selectedStandards.length,
    [selectedAPIs.length, selectedCodeSnippets.length, selectedStandards.length]
  )

  return {
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
  }
}