"use client"

import { useState, useEffect } from "react"
import { CodeEditor } from "@/components/code-editor"
import { ConceptList } from "@/components/concept-list"
import { KnowledgePanel } from "@/components/knowledge-panel"
import { extractConcepts } from "@/lib/concept-extractor"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

export default function Concept() {
	const [code, setCode] = useState(sampleCode)
	const [concepts, setConcepts] = useState<string[]>([])
	const [validConcepts, setValidConcepts] = useState<string[]>([])
	const [invalidConcepts, setInvalidConcepts] = useState<{ term: string; reason: string }[]>([])
	const [selectedConcept, setSelectedConcept] = useState<string | null>(null)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [knowledgeItems, setKnowledgeItems] = useState<any[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [isValidating, setIsValidating] = useState(false)
	const [useAI, setUseAI] = useState(true)
	// Add state for context data
	const [contextData, setContextData] = useState<any[]>([])
	const [isLoadingContext, setIsLoadingContext] = useState(false)

	// Function to fetch context data
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

	// Fetch context data on component mount
	useEffect(() => {
		fetchContextData()
	}, [])

	const handleExtractConcepts = async () => {
		const extractedConcepts = await extractConcepts(code)
		setConcepts(extractedConcepts)
		setSelectedConcept(null)
		setKnowledgeItems([])

		if (useAI && extractedConcepts.length > 0) {
			setIsValidating(true)
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
		<main className="container mx-auto p-4">
			<h1 className="text-2xl font-bold mb-6">Concept Linking MVP</h1>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					<div className="mb-4">
						<h2 className="text-lg font-semibold mb-2">Code Editor</h2>
						<CodeEditor code={code} onChange={setCode} />
						<div className="flex items-center justify-between mt-4">
							<Button onClick={handleExtractConcepts}>Extract Concepts</Button>
							<div className="flex items-center space-x-2">
								<Switch id="use-ai" checked={useAI} onCheckedChange={setUseAI} />
								<Label htmlFor="use-ai">Use AI to validate concepts</Label>
							</div>
						</div>
					</div>

					{/* Add Context Display Section */}
					<div className="mt-6">
						<div className="flex items-center justify-between mb-2">
							<h2 className="text-lg font-semibold">Code Context</h2>
							<Button
								variant="outline"
								size="sm"
								onClick={fetchContextData}
								disabled={isLoadingContext}
							>
								{isLoadingContext ? "Loading..." : "Refresh Context"}
							</Button>
						</div>
						<div className="max-h-80 overflow-y-auto">
							{contextData.length > 0 ? (
								contextData.map((item, index) => (
									<Card key={item.id || index} className="mb-4">
										<CardHeader className="py-2">
											<CardTitle className="text-sm font-medium">{item.path}</CardTitle>
										</CardHeader>
										<CardContent className="py-2">
											<div className="text-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
												{item.content}
											</div>
										</CardContent>
									</Card>
								))
							) : (
								<div className="text-center p-4 text-gray-500">
									{isLoadingContext ? "Loading context data..." : "No context data available"}
								</div>
							)}
						</div>
					</div>
				</div>

				<div className="space-y-6">
					<div>
						<h2 className="text-lg font-semibold mb-2">Extracted Concepts</h2>
						<ConceptList
							concepts={concepts}
							validConcepts={validConcepts}
							invalidConcepts={invalidConcepts}
							selectedConcept={selectedConcept}
							onSelectConcept={handleSelectConcept}
							isValidating={isValidating}
						/>
					</div>

					<div>
						<h2 className="text-lg font-semibold mb-2">Knowledge Panel</h2>
						<KnowledgePanel concept={selectedConcept} items={knowledgeItems} isLoading={isLoading} />
					</div>
				</div>
			</div>
		</main>
	)
}

