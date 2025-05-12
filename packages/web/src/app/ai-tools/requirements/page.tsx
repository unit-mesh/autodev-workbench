"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowRight } from "lucide-react"
import { Stepper } from "@/components/requirement/stepper"
import EnhancedRequirement from "@/components/requirement/enhanced-requirement"
import EpicsList from "@/components/requirement/epics-list"
import PrdDocument from "@/components/requirement/prd-document"
import UserStories from "@/components/requirement/user-stories"
import TestCases from "@/components/requirement/test-cases"
import { enhanceRequirement, generateEpics, generatePRD, generateUserStories, generateTestCases } from "@/app/actions"

export default function Home() {
	const [inputRequirement, setInputRequirement] = useState("")
	const [enhancedRequirement, setEnhancedRequirement] = useState("")
	const [epics, setEpics] = useState<string[]>([])
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [prd, setPrd] = useState<any>(null)
	const [userStories, setUserStories] = useState<string[]>([])
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [testCases, setTestCases] = useState<any[]>([])

	const [currentStep, setCurrentStep] = useState(0)
	const [isProcessing, setIsProcessing] = useState(false)
	const [activeView, setActiveView] = useState<"stories" | "testcases" | null>(null)

	const steps = [
		{ id: 0, name: "Input", description: "Enter your requirement" },
		{ id: 1, name: "Enhanced", description: "Review enhanced requirement" },
		{ id: 2, name: "Epics", description: "Review epic-level items" },
		{ id: 3, name: "PRD", description: "Review full PRD" },
		{ id: 4, name: "Deliverables", description: "Generate additional artifacts" },
	]

	async function handleEnhanceRequirement() {
		if (!inputRequirement.trim()) return

		setIsProcessing(true)
		try {
			const enhanced = await enhanceRequirement(inputRequirement)
			setEnhancedRequirement(enhanced)
			setCurrentStep(1)
		} catch (error) {
			console.error("Error enhancing requirement:", error)
		} finally {
			setIsProcessing(false)
		}
	}

	async function handleGenerateEpics() {
		setIsProcessing(true)
		try {
			const generatedEpics = await generateEpics(enhancedRequirement)
			setEpics(generatedEpics)
			setCurrentStep(2)
		} catch (error) {
			console.error("Error generating epics:", error)
		} finally {
			setIsProcessing(false)
		}
	}

	async function handleGeneratePRD() {
		setIsProcessing(true)
		try {
			const generatedPRD = await generatePRD(enhancedRequirement, epics)
			setPrd(generatedPRD)
			setCurrentStep(3)
		} catch (error) {
			console.error("Error generating PRD:", error)
		} finally {
			setIsProcessing(false)
		}
	}

	async function handleGenerateUserStories() {
		setIsProcessing(true)
		setActiveView("stories")
		try {
			const stories = await generateUserStories(enhancedRequirement, epics)
			setUserStories(stories)
			setCurrentStep(4)
		} catch (error) {
			console.error("Error generating user stories:", error)
		} finally {
			setIsProcessing(false)
		}
	}

	async function handleGenerateTestCases() {
		setIsProcessing(true)
		setActiveView("testcases")
		try {
			const tests = await generateTestCases(enhancedRequirement, epics)
			setTestCases(tests)
			setCurrentStep(4)
		} catch (error) {
			console.error("Error generating test cases:", error)
		} finally {
			setIsProcessing(false)
		}
	}

	return (
		<div className="min-h-screen from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 bg-gradient-to-b">
			<main className="container mx-auto p-4 py-8">
				<div className="flex flex-col gap-6">
					<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
						<div>
							<h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">Requirements</h1>
							<p className="text-slate-600 dark:text-slate-400 mt-1">
								Transform your ideas into detailed specifications through a guided process
							</p>
						</div>
					</div>

					<div className="grid gap-6">
						<Stepper steps={steps} currentStep={currentStep} />

						{currentStep === 0 && (
							<Card>
								<CardHeader>
									<CardTitle>Enter Your Initial Requirement</CardTitle>
									<CardDescription>
										Provide a brief description of your product idea or feature requirement
									</CardDescription>
								</CardHeader>
								<CardContent>
									<Textarea
										placeholder="e.g., Create a mobile app that helps users track their daily water intake"
										className="min-h-[120px] mb-4"
										value={inputRequirement}
										onChange={(e) => setInputRequirement(e.target.value)}
									/>
									<div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
										<span className="mr-2">💡</span>
										<span>Don&#39;t worry about being too detailed. Our AI will help enhance your requirement.</span>
									</div>
								</CardContent>
								<CardFooter className="flex justify-end">
									<Button
										onClick={handleEnhanceRequirement}
										disabled={isProcessing || !inputRequirement.trim()}
										className="bg-emerald-600 hover:bg-emerald-700"
									>
										{isProcessing ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Enhancing...
											</>
										) : (
											<>
												Enhance Requirement
												<ArrowRight className="ml-2 h-4 w-4" />
											</>
										)}
									</Button>
								</CardFooter>
							</Card>
						)}

						{currentStep === 1 && (
							<EnhancedRequirement
								originalRequirement={inputRequirement}
								enhancedRequirement={enhancedRequirement}
								onRegenerate={handleEnhanceRequirement}
								onContinue={handleGenerateEpics}
								onBack={() => setCurrentStep(0)}
								isProcessing={isProcessing}
							/>
						)}

						{currentStep === 2 && (
							<EpicsList
								enhancedRequirement={enhancedRequirement}
								epics={epics}
								onRegenerate={handleGenerateEpics}
								onContinue={handleGeneratePRD}
								onBack={() => setCurrentStep(1)}
								isProcessing={isProcessing}
							/>
						)}

						{currentStep === 3 && (
							<PrdDocument
								prd={prd}
								onRegenerate={handleGeneratePRD}
								onGenerateUserStories={handleGenerateUserStories}
								onGenerateTestCases={handleGenerateTestCases}
								onBack={() => setCurrentStep(2)}
								isProcessing={isProcessing}
							/>
						)}

						{currentStep === 4 && activeView === "stories" && (
							<UserStories
								userStories={userStories}
								onRegenerate={handleGenerateUserStories}
								onGenerateTestCases={handleGenerateTestCases}
								onBack={() => setCurrentStep(3)}
								isProcessing={isProcessing}
							/>
						)}

						{currentStep === 4 && activeView === "testcases" && (
							<TestCases
								testCases={testCases}
								onRegenerate={handleGenerateTestCases}
								onGenerateUserStories={handleGenerateUserStories}
								onBack={() => setCurrentStep(3)}
								isProcessing={isProcessing}
							/>
						)}
					</div>
				</div>
			</main>
		</div>
	)
}
