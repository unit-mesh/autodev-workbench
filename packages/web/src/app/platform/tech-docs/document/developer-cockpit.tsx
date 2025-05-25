"use client"

import { useState, useEffect } from "react"
import { MainSidebar } from "@/app/platform/tech-docs/document/main-sidebar"
import { Dashboard } from "@/app/platform/tech-docs/document/dashboard"
import { DocumentViewer } from "@/app/platform/tech-docs/document/document-viewer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { SearchDialog } from "@/app/platform/tech-docs/document/search-dialog"
import { cn } from "@/lib/utils"

export function DeveloperCockpit() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [currentView, setCurrentView] = useState<"dashboard" | "document">("dashboard")
  const [currentDocId, setCurrentDocId] = useState<string | null>(null)

  const isDesktop = useMediaQuery("(min-width: 1024px)")

  // 在小屏幕上默认关闭侧边栏
  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false)
    } else {
      setSidebarOpen(true)
    }
  }, [isDesktop])

  const openDocument = (docId: string) => {
    setCurrentView("document")
    setCurrentDocId(docId)
    if (!isDesktop) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="flex flex-1 overflow-hidden">
        <MainSidebar
          isOpen={sidebarOpen}
          closeSidebar={() => setSidebarOpen(false)}
          openDocument={openDocument}
          currentDocId={currentDocId}
        />

        <main
          className={cn(
            "flex-1 overflow-hidden transition-all duration-300 ml-4",
          )}
        >
          {currentView === "dashboard" ? (
            <Dashboard openDocument={openDocument} />
          ) : (
            <DocumentViewer documentId={currentDocId} />
          )}
        </main>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} openDocument={openDocument} />
    </div>
  )
}
