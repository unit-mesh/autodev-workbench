"use client"

import { useState } from "react"
import { CodeEditor } from "@/components/code-editor"
import { ConceptList } from "@/components/concept-list"
import { KnowledgePanel } from "@/components/knowledge-panel"
import { extractConcepts } from "@/lib/concept-extractor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Code2, Brain, BookOpen } from "lucide-react"

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

export function ConceptLinking({ useAI }: { useAI: boolean }) {
  const [code, setCode] = useState(sampleCode)
  const [concepts, setConcepts] = useState<string[]>([])
  const [validConcepts, setValidConcepts] = useState<string[]>([])
  const [invalidConcepts, setInvalidConcepts] = useState<{ term: string; reason: string }[]>([])
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [knowledgeItems, setKnowledgeItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            concepts: extractedConcepts,
            codeContext: code,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setValidConcepts(data.validConcepts)
          setInvalidConcepts(data.invalidConcepts)
        } else {
          console.error("Failed to validate concepts")
          // If validation fails, treat all as valid
          setValidConcepts(extractedConcepts)
          setInvalidConcepts([])
        }
      } catch (error) {
        console.error("Error validating concepts:", error)
        // If validation fails, treat all as valid
        setValidConcepts(extractedConcepts)
        setInvalidConcepts([])
      } finally {
        setIsValidating(false)
      }
    } else {
      // If AI validation is disabled, treat all as valid
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

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card className="border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
        <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-purple-500"/>
              <CardTitle className="text-lg">Code Linking</CardTitle>
            </div>
            <Button
              onClick={handleExtractConcepts}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={isValidating}
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                  Processing...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4"/>
                  Extract Concepts
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 bg-white dark:bg-slate-800">
          <CodeEditor code={code} onChange={setCode}/>
        </CardContent>
      </Card>

      <div className="space-y-6 grid grid-rows-1">
        <Card className="border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
          <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-lg">Extracted Concepts</CardTitle>
            </div>
            {concepts.length > 0 && (
              <div className="flex gap-2 mt-2">
                <Badge
                  variant="outline"
                  className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {concepts.length} concepts found
                </Badge>
                {validConcepts.length > 0 && (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {validConcepts.length} valid
                  </Badge>
                )}
                {invalidConcepts.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                  >
                    {invalidConcepts.length} invalid
                  </Badge>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 bg-white dark:bg-slate-800 max-h-[250px] overflow-y-auto">
              <ConceptList
                concepts={concepts}
                validConcepts={validConcepts}
                invalidConcepts={invalidConcepts}
                selectedConcept={selectedConcept}
                onSelectConcept={handleSelectConcept}
                isValidating={isValidating}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
          <CardHeader className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-lg">Knowledge Panel</CardTitle>
              </div>
              {selectedConcept && (
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400">
                  {selectedConcept}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 bg-white dark:bg-slate-800 max-h-[250px] overflow-y-auto">
              <KnowledgePanel concept={selectedConcept} items={knowledgeItems} isLoading={isLoading} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
