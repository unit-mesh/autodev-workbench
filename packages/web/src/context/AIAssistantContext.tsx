"use client"

import React, { createContext, useContext, useState } from "react"

interface AIAssistantContextType {
  isOpen: boolean
  toggleAssistant: () => void
  openAssistant: () => void
  closeAssistant: () => void
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined)

export function AIAssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleAssistant = () => setIsOpen(prev => !prev)
  const openAssistant = () => setIsOpen(true)
  const closeAssistant = () => setIsOpen(false)

  return (
    <AIAssistantContext.Provider value={{ isOpen, toggleAssistant, openAssistant, closeAssistant }}>
      {children}
    </AIAssistantContext.Provider>
  )
}

export function useAIAssistant() {
  const context = useContext(AIAssistantContext)
  if (context === undefined) {
    throw new Error("useAIAssistant must be used within an AIAssistantProvider")
  }
  return context
}
