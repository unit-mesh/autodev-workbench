"use client"

import { useState, useEffect } from "react"
import { CodeEditor } from "@/components/code-editor"
import { ConceptList } from "@/components/concept-list"
import { KnowledgePanel } from "@/components/knowledge-panel"
import { extractConcepts } from "@/lib/concept-extractor"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Code2, Brain, RefreshCw, Zap, BookOpen, FileText } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

const sampleCode = `/**
 * PaymentProcessor handles all payment gateway interactions
 * Related to the Payment Service Architecture (PSA)
 */
class PaymentProcessor {
  /**
   * Process a payment through the payment gateway
   * @param {Transaction} transaction The transaction to process
   * @returns {PaymentResult} The result of the payment attempt
   */
  async processPayment(transaction) {
    // Implementation follows the Stripe Integration Guide
    const paymentIntent = await this.stripe.createPaymentIntent({
      amount: transaction.amount,
      currency: transaction.currency,
    });
    
    return new PaymentResult(paymentIntent);
  }
}`

export default function ConceptLinking() {
  const [code, setCode] = useState(sampleCode)
  const [concepts, setConcepts] = useState<string[]>([])
  const [validConcepts, setValidConcepts] = useState<string[]>([])
  const [invalidConcepts, setInvalidConcepts] = useState<{ term: string; reason: string }[]>([])
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null)
  const [knowledgeItems, setKnowledgeItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [useAI, setUseAI] = useState(true)
  const [contextData, setContextData] = useState<any[]>([])
  const [isLoadingContext, setIsLoadingContext] = useState(false)

  const fetchContextData = async () => {
    setIsLoadingContext(true)
    try {
      const response = await fetch("/api/context")
      if (response.ok) {
        const data = await response.json()
        setContextData(data)
      } else {
        console.error("Failed to fetch context data")
      }
    } catch (error) {
      console.error("Error fetching context data:", error)
    } finally {
      setIsLoadingContext(false)
    }
  }

  useEffect(() => {
    fetchContextData()
  }, [])

  const handleExtractConcepts = async () => {
    setIsValidating(true)
    const extractedConcepts = await extractConcepts(code)
    setConcepts(extractedConcepts)
    setSelectedConcept(null)
    setKnowledgeItems([])

    if (useAI && extractedConcepts.length > 0) {
      try {
        const response = await fetch("/api/validate-concepts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concepts: extractedConcepts, codeContext: code }),
        })

        if (response.ok) {
          const data = await response.json()
          setValidConcepts(data.validConcepts)
          setInvalidConcepts(data.invalidConcepts)
        } else {
          console.error("Failed to validate concepts")
          setValidConcepts(extractedConcepts)
          setInvalidConcepts([])
        }
      } catch (error) {
        console.error("Error validating concepts:", error)
        setValidConcepts(extractedConcepts)
        setInvalidConcepts([])
      } finally {
        setIsValidating(false)
      }
    } else {
      setValidConcepts(extractedConcepts)
      setInvalidConcepts([])
      setIsValidating(false)
    }
  }

  const handleSelectConcept = async (concept: string) => {
    setSelectedConcept(concept)
    setIsLoading(true)

    try {
      const response = await fetch(`/api/knowledge?concept=${encodeURIComponent(concept)}`)
      const data = await response.json()
      setKnowledgeItems(data)
    } catch (error) {
      console.error("Failed to fetch knowledge items:", error)
      setKnowledgeItems([])
    } finally {
      setIsLoading(false)
    }
  }

  const getLanguageFromContext = (item: any) => {
    if (item.language) return item.language.toLowerCase()
    if (item.path) {
      const extension = item.path.split(".").pop()?.toLowerCase()
      switch (extension) {
        case "js": return "javascript"
        case "ts": return "typescript"
        case "tsx": return "tsx"
        case "jsx": return "jsx"
        case "py": return "python"
        case "java": return "java"
        case "rb": return "ruby"
        case "go": return "go"
        case "php": return "php"
        case "c": return "c"
        case "cpp": return "cpp"
        case "cs": return "csharp"
        case "html": return "html"
        case "css": return "css"
        case "json": return "json"
        case "md": return "markdown"
        case "yaml":
        case "yml": return "yaml"
        default: return "text"
      }
    }
    return "text"
  }

  const extractCodeBlock = (content: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9]+)?\s*\n([\s\S]*?)```/g
    const matches = [...content.matchAll(codeBlockRegex)]

    if (matches.length > 0) {
      return matches.map((match) => ({ language: match[1] || "text", code: match[2].trim() }))
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* ...existing code... full JSX as in original page.tsx */}
    </div>
  )
}
