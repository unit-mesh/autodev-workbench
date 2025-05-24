"use client"

import React, { createContext, use, useState } from "react"

interface AIAssistantContextType {
  isOpen: boolean
  toggleAssistant: () => void
  openAssistant: () => void
  closeAssistant: () => void
}

const AiAssistantContext = createContext<AIAssistantContextType | undefined>(undefined)

export function AIAssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleAssistant = () => setIsOpen(prev => !prev)
  const openAssistant = () => setIsOpen(true)
  const closeAssistant = () => setIsOpen(false)

  return (
    <AiAssistantContext.Provider value={{ isOpen, toggleAssistant, openAssistant, closeAssistant }}>
      {children}
    </AiAssistantContext.Provider>
  )
}

export function useAIAssistant() {
  const context = use(AiAssistantContext)
  if (context === undefined) {
    throw new Error("useAIAssistant must be used within an AIAssistantProvider")
  }
  return context
}
