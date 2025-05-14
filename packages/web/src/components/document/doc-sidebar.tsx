"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface DocSidebarProps {
  className?: string
}

export default function DocSidebar({ className }: DocSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    users: true,
    authentication: false,
    webhooks: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <div className={cn("pr-4 space-y-4", className)}>
      <div className="space-y-1">
        <h3 className="font-medium text-sm px-2 text-gray-900 dark:text-gray-100">Getting Started</h3>
        <nav className="space-y-1">
          <Link
            href="/api/introduction"
            className="block text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
          >
            Introduction
          </Link>
          <Link
            href="/api/authentication"
            className="block text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
          >
            Authentication
          </Link>
          <Link
            href="/api/errors"
            className="block text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
          >
            Errors
          </Link>
          <Link
            href="/api/rate-limits"
            className="block text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
          >
            Rate Limits
          </Link>
          <Link
            href="/api/versioning"
            className="block text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
          >
            Versioning
          </Link>
        </nav>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">Core Resources</h3>
        </div>

        <div className="space-y-1">
          <div>
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between rounded-md p-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-gray-800 dark:hover:text-blue-400"
              onClick={() => toggleSection("users")}
            >
              <span>Users</span>
              <ChevronDown
                className={cn("h-4 w-4 transition-transform duration-200", expandedSections.users ? "rotate-180" : "")}
              />
            </Button>
            {expandedSections.users && (
              <div className="ml-4 space-y-1 pt-1 animate-in slide-in-from-left-2 duration-200">
                <Link
                  href="/api/users"
                  className="block text-sm px-3 py-2 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 font-medium"
                >
                  List Users
                </Link>
                <Link
                  href="/api/users/create"
                  className="block text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
                >
                  Create a User
                </Link>
                <Link
                  href="/api/users/retrieve"
                  className="block text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
                >
                  Retrieve a User
                </Link>
                <Link
                  href="/api/users/update"
                  className="block text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
                >
                  Update a User
                </Link>
                <Link
                  href="/api/users/delete"
                  className="block text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
                >
                  Delete a User
                </Link>
              </div>
            )}
          </div>

          <div>
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between rounded-md p-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-gray-800 dark:hover:text-blue-400"
              onClick={() => toggleSection("authentication")}
            >
              <span>Authentication</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  expandedSections.authentication ? "rotate-180" : "",
                )}
              />
            </Button>
            {expandedSections.authentication && (
              <div className="ml-4 space-y-1 pt-1 animate-in slide-in-from-left-2 duration-200">
                <Link
                  href="/api/authentication/tokens"
                  className="block text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
                >
                  Tokens
                </Link>
                <Link
                  href="/api/authentication/sessions"
                  className="block text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
                >
                  Sessions
                </Link>
              </div>
            )}
          </div>

          <div>
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between rounded-md p-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-gray-800 dark:hover:text-blue-400"
              onClick={() => toggleSection("webhooks")}
            >
              <span>Webhooks</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  expandedSections.webhooks ? "rotate-180" : "",
                )}
              />
            </Button>
            {expandedSections.webhooks && (
              <div className="ml-4 space-y-1 pt-1 animate-in slide-in-from-left-2 duration-200">
                <Link
                  href="/api/webhooks/create"
                  className="block text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
                >
                  Create Webhook
                </Link>
                <Link
                  href="/api/webhooks/events"
                  className="block text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
                >
                  Events
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="font-medium text-sm px-2 text-gray-900 dark:text-gray-100">Additional Resources</h3>
        <nav className="space-y-1">
          <Link
            href="/api/sdks"
            className="block text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
          >
            SDKs & Libraries
          </Link>
          <Link
            href="/api/examples"
            className="block text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
          >
            Examples
          </Link>
          <Link
            href="/api/changelog"
            className="block text-sm px-3 py-2 rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
          >
            Changelog
          </Link>
        </nav>
      </div>
    </div>
  )
}
