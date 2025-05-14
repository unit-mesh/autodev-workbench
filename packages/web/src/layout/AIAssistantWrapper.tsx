"use client"

import { AIAssistant } from "@/components/document/ai-assistant"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useAIAssistant } from "@/context/AIAssistantContext"

export function AIAssistantWrapper() {
  const { isOpen, closeAssistant } = useAIAssistant()
  const isTablet = useMediaQuery("(min-width: 768px)")

  if (!isOpen) return null

  return (
    <AIAssistant
      closeAssistant={closeAssistant}
      currentDocId={null}
      isTablet={isTablet}
    />
  )
}
