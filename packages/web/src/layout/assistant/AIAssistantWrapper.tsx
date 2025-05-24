"use client"

import { AIAssistant } from "@/layout/assistant/ai-assistant"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useAIAssistant } from "@/layout/assistant/AIAssistantContext"

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
