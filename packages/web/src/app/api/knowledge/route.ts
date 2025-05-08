import { type NextRequest, NextResponse } from "next/server"

// Mock data for demonstration purposes
const mockKnowledgeBase = [
  {
    id: "JIRA-1001",
    type: "jira",
    key: "PAY-1001",
    title: "Implement PaymentProcessor for Stripe integration",
    description: "Create a new PaymentProcessor class that handles all interactions with the Stripe payment gateway.",
    status: "Done",
    assignee: "John Doe",
    created: "2023-05-15",
    updated: "2023-05-20",
  },
  {
    id: "JIRA-1002",
    type: "jira",
    key: "PAY-1002",
    title: "Fix transaction handling in PaymentProcessor",
    description: "There's an issue with how transactions are processed when the currency is not USD.",
    status: "In Progress",
    assignee: "Jane Smith",
    created: "2023-06-01",
    updated: "2023-06-05",
  },
  {
    id: "CONF-2001",
    type: "confluence",
    title: "Payment Service Architecture (PSA)",
    description:
      "This document outlines the architecture of our payment service, including the PaymentProcessor component and its interactions with external payment gateways.",
    created: "2023-04-10",
    updated: "2023-05-25",
    author: "Alex Johnson",
  },
  {
    id: "CONF-2002",
    type: "confluence",
    title: "Stripe Integration Guide",
    description: "A comprehensive guide on how to integrate with Stripe, including code examples and best practices.",
    created: "2023-03-15",
    updated: "2023-04-20",
    author: "Sarah Williams",
  },
  {
    id: "JIRA-1003",
    type: "jira",
    key: "PAY-1003",
    title: "Add support for PaymentResult caching",
    description: "Implement a caching mechanism for PaymentResult objects to improve performance.",
    status: "To Do",
    assignee: "Mike Brown",
    created: "2023-06-10",
    updated: "2023-06-10",
  },
  {
    id: "CONF-2003",
    type: "confluence",
    title: "Transaction Processing Workflow",
    description:
      "This document describes the end-to-end workflow for processing transactions, including the role of the PaymentProcessor.",
    created: "2023-05-05",
    updated: "2023-06-02",
    author: "David Lee",
  },
]

export async function GET(request: NextRequest) {
  // Get the concept from the query parameters
  const searchParams = request.nextUrl.searchParams
  const concept = searchParams.get("concept")

  if (!concept) {
    return NextResponse.json({ error: "Concept parameter is required" }, { status: 400 })
  }

  // In a real implementation, this would query Jira and Confluence APIs
  // For this MVP, we'll filter our mock data based on the concept
  const results = mockKnowledgeBase.filter((item) => {
    const searchText = `${item.title} ${item.description}`.toLowerCase()
    return searchText.includes(concept.toLowerCase())
  })

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json(results)
}
