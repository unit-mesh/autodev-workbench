"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Zap } from "lucide-react"
import { CodebaseContext } from "@/app/knowledge/concept-linking/codebase-context"
import { ConceptLinking } from "@/app/knowledge/concept-linking/concept-linking"

export default function Concept() {
  const [useAI, setUseAI] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
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
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm">
              <Switch id="use-ai" checked={useAI} onCheckedChange={setUseAI}/>
              <Label htmlFor="use-ai" className="flex items-center gap-1.5 cursor-pointer">
                <Zap className="h-4 w-4 text-amber-500"/>
                <span>AI Validation</span>
              </Label>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-6">
              <CodebaseContext />
            </div>

            <ConceptLinking useAI={useAI} />
          </div>
        </div>
      </main>
    </div>
  )
}
