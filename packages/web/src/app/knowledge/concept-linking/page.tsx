"use client"

import { useState } from "react"
import { CodebaseContext } from "@/app/knowledge/concept-linking/codebase-context"
import { ConceptLinking } from "@/app/knowledge/concept-linking/concept-linking"

export default function Concept() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [useAI, setUseAI] = useState(true)

  return (
    <div className="min-h-screen from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <main className="container mx-auto p-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1
                className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Concept
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Extract, validate, and explore concepts from your code
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            <CodebaseContext />

            <ConceptLinking useAI={useAI} />
          </div>
        </div>
      </main>
    </div>
  )
}
