"use client"

import { useState, useEffect } from "react"
import { MainHeader } from "@/components/main-header"
import { MainSidebar } from "@/components/main-sidebar"
import { Dashboard } from "@/components/dashboard"
import { DocumentViewer } from "@/components/document-viewer"
import { AIAssistant } from "@/components/ai-assistant"
import { useMediaQuery } from "@/hooks/use-media-query"
import { SearchDialog } from "@/components/search-dialog"
import { cn } from "@/lib/utils"

export function DeveloperCockpit() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [currentView, setCurrentView] = useState<"dashboard" | "document">("dashboard")
  const [currentDocId, setCurrentDocId] = useState<string | null>(null)
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")

  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const isTablet = useMediaQuery("(min-width: 768px)")

  // 在小屏幕上默认关闭侧边栏
  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false)
    } else {
      setSidebarOpen(true)
    }
  }, [isDesktop])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const toggleAssistant = () => setAssistantOpen(!assistantOpen)
  const toggleSearch = () => setSearchOpen(!searchOpen)

  const openDocument = (docId: string) => {
    setCurrentView("document")
    setCurrentDocId(docId)
    if (!isDesktop) {
      setSidebarOpen(false)
    }
  }

  const goToDashboard = () => {
    setCurrentView("dashboard")
    setCurrentDocId(null)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <MainHeader
        toggleSidebar={toggleSidebar}
        toggleAssistant={toggleAssistant}
        toggleSearch={toggleSearch}
        goToDashboard={goToDashboard}
        isAssistantOpen={assistantOpen}
        theme={theme}
        setTheme={setTheme}
      />

      <div className="flex flex-1 overflow-hidden">
        <MainSidebar
          isOpen={sidebarOpen}
          closeSidebar={() => setSidebarOpen(false)}
          openDocument={openDocument}
          currentDocId={currentDocId}
        />

        <main
          className={cn(
            "flex-1 overflow-hidden transition-all duration-300",
            sidebarOpen && isDesktop ? "ml-64" : "ml-0",
          )}
        >
          {currentView === "dashboard" ? (
            <Dashboard openDocument={openDocument} />
          ) : (
            <DocumentViewer documentId={currentDocId} />
          )}
        </main>

        {assistantOpen && (
          <AIAssistant closeAssistant={() => setAssistantOpen(false)} currentDocId={currentDocId} isTablet={isTablet} />
        )}
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} openDocument={openDocument} />
    </div>
  )
}
