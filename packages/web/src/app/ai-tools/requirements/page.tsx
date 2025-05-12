"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowRight, ArrowLeft, Sparkles } from "lucide-react" // Added Sparkles, RefreshCw, ArrowLeft
import { Stepper } from "@/components/requirement/stepper"
// import EnhancedRequirement from "@/components/requirement/enhanced-requirement" // Removed
import EpicsList from "@/components/requirement/epics-list"
import PrdDocument from "@/components/requirement/prd-document"
import UserStories from "@/components/requirement/user-stories"
import TestCases from "@/components/requirement/test-cases"
import { enhanceRequirement, generateEpics, generatePRD, generateUserStories, generateTestCases } from "@/app/actions"

export default function Home() {
	const [inputRequirement, setInputRequirement] = useState("")
	const [originalUserInput, setOriginalUserInput] = useState("") // New state for the initial raw input
	const [isEnhanced, setIsEnhanced] = useState(false) // New state to track if enhancement has occurred
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
		{ id: 1, name: "Refine", description: "Refine requirement & create epics" },
		{ id: 2, name: "Epics", description: "Review epics & create PRD" },
		{ id: 3, name: "PRD", description: "Review PRD & create deliverables" },
		{ id: 4, name: "Deliverables", description: "Review generated artifacts" },
	]

	async function handleEnhanceRequirement() {
		if (!inputRequirement.trim()) return

		setIsProcessing(true)
		try {
			const textToEnhance = inputRequirement
			if (!isEnhanced) {
				setOriginalUserInput(textToEnhance)
			}
			const enhanced = await enhanceRequirement(textToEnhance)
			setInputRequirement(enhanced)
			setIsEnhanced(true)
			setCurrentStep(1)
		} catch (error) {
			console.error("Error enhancing requirement:", error)
		} finally {
			setIsProcessing(false)
		}
	}

	async function handleGenerateEpics() {
		if (!inputRequirement.trim()) return
		setIsProcessing(true)
		try {
			const generatedEpics = await generateEpics(inputRequirement)
			setEpics(generatedEpics)
			setCurrentStep(2)
		} catch (error) {
			console.error("Error generating epics:", error)
		} finally {
			setIsProcessing(false)
		}
	}

	async function handleGeneratePRD() {
		if (!inputRequirement.trim() || epics.length === 0) return
		setIsProcessing(true)
		try {
			const generatedPRD = await generatePRD(inputRequirement, epics)
			setPrd(generatedPRD)
			setCurrentStep(3)
		} catch (error) {
			console.error("Error generating PRD:", error)
		} finally {
			setIsProcessing(false)
		}
	}

	async function handleGenerateUserStories() {
		if (!inputRequirement.trim() || epics.length === 0) return
		setIsProcessing(true)
		setActiveView("stories")
		try {
			const stories = await generateUserStories(inputRequirement, epics)
			setUserStories(stories)
			setCurrentStep(4)
		} catch (error) {
			console.error("Error generating user stories:", error)
		} finally {
			setIsProcessing(false)
		}
	}

	async function handleGenerateTestCases() {
		if (!inputRequirement.trim() || epics.length === 0) return
		setIsProcessing(true)
		setActiveView("testcases")
		try {
			const tests = await generateTestCases(inputRequirement, epics)
			setTestCases(tests)
			setCurrentStep(4)
		} catch (error) {
			console.error("Error generating test cases:", error)
		} finally {
			setIsProcessing(false)
		}
	}

	const cardTitle = () => {
		if (currentStep === 0) return "Enter Your Initial Requirement"
		if (currentStep === 1) return "Refine Requirement & Proceed"
		return "Current Requirement"
	}

	const cardDescription = () => {
		if (currentStep === 0) return "Provide a brief description of your product idea or feature requirement."
		if (currentStep === 1) return "Your requirement has been enhanced. You can refine it further below or proceed to generate epics."
		if (currentStep === 2) return "Epics generated. Review/edit the requirement or proceed to generate PRD."
		if (currentStep === 3) return "PRD generated. Review/edit the requirement or generate deliverables."
		if (currentStep === 4) return "Additional deliverables generated. You can still refine the main requirement."
		return ""
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
						<Stepper steps={steps} currentStep={currentStep}/>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									{currentStep > 0 && <Sparkles className="h-5 w-5 mr-2 text-emerald-500"/>}
									{cardTitle()}
								</CardTitle>
								<CardDescription>{cardDescription()}</CardDescription>
							</CardHeader>
							<CardContent>
								{isEnhanced && (
									<div className="mb-4">
										<h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
											Original Input:
										</h3>
										<p className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300">
											{originalUserInput}
										</p>
									</div>
								)}
								<Textarea
									placeholder={
										currentStep === 0
											? "e.g., Create a mobile app that helps users track their daily water intake"
											: "Review and refine the requirement. It will be used for subsequent generation steps."
									}
									className="min-h-[120px] mb-4"
									value={inputRequirement}
									onChange={(e) => setInputRequirement(e.target.value)}
								/>
								{currentStep === 0 && (
									<div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
										<span className="mr-2">💡</span>
										<span>Don&#39;t worry about being too detailed. Our AI will help enhance your requirement.</span>
									</div>
								)}
							</CardContent>
							<CardFooter className="flex justify-between">
								<div>
									{currentStep === 1 && (
										<Button
											variant="outline"
											onClick={() => {
												setCurrentStep(0)
												setIsEnhanced(false)
												setInputRequirement(originalUserInput)
											}}
											disabled={isProcessing}
										>
											<ArrowLeft className="mr-2 h-4 w-4"/>
											Back to Input
										</Button>
									)}
									{currentStep === 2 && (
										<Button variant="outline" onClick={() => setCurrentStep(1)} disabled={isProcessing}>
											<ArrowLeft className="mr-2 h-4 w-4"/>
											Back to Refine
										</Button>
									)}
									{currentStep === 3 && (
										<Button variant="outline" onClick={() => setCurrentStep(2)} disabled={isProcessing}>
											<ArrowLeft className="mr-2 h-4 w-4"/>
											Back to Epics
										</Button>
									)}
									{currentStep === 4 && (
										<Button variant="outline" onClick={() => setCurrentStep(3)} disabled={isProcessing}>
											<ArrowLeft className="mr-2 h-4 w-4"/>
											Back to PRD
										</Button>
									)}
								</div>

								<div className="flex gap-2">
									{currentStep === 0 && (
										<Button
											onClick={handleEnhanceRequirement}
											disabled={isProcessing || !inputRequirement.trim()}
											className="bg-emerald-600 hover:bg-emerald-700"
										>
											{isProcessing ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin"/>
													Enhancing...
												</>
											) : (
												<>
													<Sparkles className="mr-2 h-4 w-4"/>
													Enhance Requirement
													<ArrowRight className="ml-2 h-4 w-4"/>
												</>
											)}
										</Button>
									)}

									{currentStep >= 1 && currentStep <= 4 && (
										<Button
											variant="outline"
											onClick={handleEnhanceRequirement}
											disabled={isProcessing || !inputRequirement.trim()}
										>
											{isProcessing && currentStep === 1 ? ( // Show loader only if this button triggered it
												<Loader2 className="mr-2 h-4 w-4 animate-spin"/>
											) : (
												<Sparkles className="mr-2 h-4 w-4"/>
											)}
											Re-enhance
										</Button>
									)}

									{currentStep === 1 && (
										<Button
											onClick={handleGenerateEpics}
											disabled={isProcessing || !inputRequirement.trim()}
											className="bg-emerald-600 hover:bg-emerald-700"
										>
											{isProcessing ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin"/>
													Generating Epics...
												</>
											) : (
												<>
													Generate Epics
													<ArrowRight className="ml-2 h-4 w-4"/>
												</>
											)}
										</Button>
									)}

									{currentStep === 2 && (
										<Button
											onClick={handleGeneratePRD}
											disabled={isProcessing || !inputRequirement.trim() || epics.length === 0}
											className="bg-emerald-600 hover:bg-emerald-700"
										>
											{isProcessing ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin"/>
													Generating PRD...
												</>
											) : (
												<>
													Generate PRD
													<ArrowRight className="ml-2 h-4 w-4"/>
												</>
											)}
										</Button>
									)}

									{currentStep === 3 && (
										<>
											<Button
												onClick={handleGenerateUserStories}
												disabled={isProcessing || !inputRequirement.trim() || epics.length === 0}
												className="bg-sky-600 hover:bg-sky-700"
											>
												{isProcessing && activeView === "stories" ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin"/>
												) : null}
												User Stories
											</Button>
											<Button
												onClick={handleGenerateTestCases}
												disabled={isProcessing || !inputRequirement.trim() || epics.length === 0}
												className="bg-lime-600 hover:bg-lime-700"
											>
												{isProcessing && activeView === "testcases" ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin"/>
												) : null}
												Test Cases
											</Button>
										</>
									)}
								</div>
							</CardFooter>
						</Card>

						{currentStep === 2 && epics.length > 0 && (
							<EpicsList
								enhancedRequirement={inputRequirement} // Use current inputRequirement
								epics={epics}
								onRegenerate={handleGenerateEpics} // Regenerate epics with current inputRequirement
								// onContinue prop removed, handled by main card
								onBack={() => setCurrentStep(1)}
								isProcessing={isProcessing}
							/>
						)}

						{currentStep === 3 && prd && (
							<PrdDocument
								prd={prd}
								onRegenerate={handleGeneratePRD} // Regenerate PRD with current inputRequirement and epics
								onGenerateUserStories={handleGenerateUserStories}
								onGenerateTestCases={handleGenerateTestCases}
								onBack={() => setCurrentStep(2)}
								isProcessing={isProcessing}
							/>
						)}

						{currentStep === 4 && activeView === "stories" && userStories.length > 0 && (
							<UserStories
								userStories={userStories}
								onRegenerate={handleGenerateUserStories} // Regenerate with current inputRequirement and epics
								onGenerateTestCases={handleGenerateTestCases} // Allow switching to test cases
								onBack={() => {
									setCurrentStep(3)
									setActiveView(null)
								}}
								isProcessing={isProcessing}
							/>
						)}

						{currentStep === 4 && activeView === "testcases" && testCases.length > 0 && (
							<TestCases
								testCases={testCases}
								onRegenerate={handleGenerateTestCases} // Regenerate with current inputRequirement and epics
								onGenerateUserStories={handleGenerateUserStories} // Allow switching to user stories
								onBack={() => {
									setCurrentStep(3)
									setActiveView(null)
								}}
								isProcessing={isProcessing}
							/>
						)}
					</div>
				</div>
			</main>
		</div>
	)
}

