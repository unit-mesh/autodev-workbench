import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { Search, Moon, Sun, Clock, FileText, Book, Code } from "lucide-react"

// 修改主体内容，改进搜索结果页面的视觉效果
export default function SearchPage() {
  // This would normally be fetched based on the search query
  const searchQuery = "authentication"
  const searchResults = [
    {
      title: "Authentication Guide",
      path: "/guides/authentication",
      type: "Guide",
      description:
        "Learn how to implement secure authentication in your applications. This guide covers API keys, OAuth 2.0, and JWT tokens.",
      lastUpdated: "May 5, 2025",
    },
    {
      title: "Authentication API Reference",
      path: "/api/authentication",
      type: "API",
      description:
        "Complete reference for the Authentication API endpoints, including user creation, token management, and session handling.",
      lastUpdated: "May 10, 2025",
    },
    {
      title: "OAuth 2.0 Implementation",
      path: "/guides/oauth2",
      type: "Guide",
      description: "Step-by-step guide for implementing OAuth 2.0 authentication flow in your applications.",
      lastUpdated: "April 28, 2025",
    },
    {
      title: "JWT Authentication with Node.js",
      path: "/tutorials/jwt-nodejs",
      type: "Tutorial",
      description: "Learn how to use JSON Web Tokens (JWT) for authentication in your Node.js applications.",
      lastUpdated: "April 15, 2025",
    },
    {
      title: "Authentication SDK for JavaScript",
      path: "/sdks/javascript/authentication",
      type: "SDK",
      description:
        "Documentation for the Authentication SDK for JavaScript, including installation, configuration, and usage examples.",
      lastUpdated: "May 8, 2025",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Search Results
            </h1>
            <form className="relative">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search documentation..."
                    className="pl-10 py-6 text-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    defaultValue={searchQuery}
                  />
                  <Button type="submit" className="absolute right-1.5 top-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                    Search
                  </Button>
                </div>
              </div>
            </form>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-64 space-y-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Filter by Type</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="type-api" className="text-blue-600 focus:ring-blue-500" />
                    <label
                      htmlFor="type-api"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
                    >
                      API Reference
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="type-guide" className="text-blue-600 focus:ring-blue-500" />
                    <label
                      htmlFor="type-guide"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
                    >
                      Guides
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="type-tutorial" className="text-blue-600 focus:ring-blue-500" />
                    <label
                      htmlFor="type-tutorial"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
                    >
                      Tutorials
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="type-sdk" className="text-blue-600 focus:ring-blue-500" />
                    <label
                      htmlFor="type-sdk"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
                    >
                      SDKs
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Filter by Product</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="product-auth" className="text-blue-600 focus:ring-blue-500" />
                    <label
                      htmlFor="product-auth"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
                    >
                      Authentication
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="product-payments" className="text-blue-600 focus:ring-blue-500" />
                    <label
                      htmlFor="product-payments"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
                    >
                      Payments
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="product-storage" className="text-blue-600 focus:ring-blue-500" />
                    <label
                      htmlFor="product-storage"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
                    >
                      Storage
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="product-analytics" className="text-blue-600 focus:ring-blue-500" />
                    <label
                      htmlFor="product-analytics"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
                    >
                      Analytics
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="font-medium mb-3 text-gray-900 dark:text-gray-100">Filter by Language</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="lang-js" className="text-blue-600 focus:ring-blue-500" />
                    <label
                      htmlFor="lang-js"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
                    >
                      JavaScript
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="lang-python" className="text-blue-600 focus:ring-blue-500" />
                    <label
                      htmlFor="lang-python"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
                    >
                      Python
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="lang-java" className="text-blue-600 focus:ring-blue-500" />
                    <label
                      htmlFor="lang-java"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
                    >
                      Java
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="lang-go" className="text-blue-600 focus:ring-blue-500" />
                    <label
                      htmlFor="lang-go"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300"
                    >
                      Go
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-center mb-4 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Found <strong>{searchResults.length}</strong> results for "
                  <strong className="text-blue-600 dark:text-blue-400">{searchQuery}</strong>"
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Sort by:</span>
                  <Tabs defaultValue="relevance">
                    <TabsList className="bg-gray-100 dark:bg-gray-700">
                      <TabsTrigger
                        value="relevance"
                        className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600"
                      >
                        Relevance
                      </TabsTrigger>
                      <TabsTrigger
                        value="date"
                        className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-gray-600"
                      >
                        Date
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <Link href={result.path} key={index} className="block group">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200 group-hover:translate-y-[-2px]">
                      <div className="flex items-start justify-between mb-1">
                        <h2 className="text-xl font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {result.title}
                        </h2>
                        <Badge
                          variant="outline"
                          className="ml-2 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                        >
                          {result.type === "API" && <Code className="h-3 w-3 mr-1" />}
                          {result.type === "Guide" && <Book className="h-3 w-3 mr-1" />}
                          {result.type === "Tutorial" && <FileText className="h-3 w-3 mr-1" />}
                          {result.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">{result.path}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{result.description}</p>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        Updated {result.lastUpdated}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <div className="inline-flex rounded-md shadow-sm">
                  <Button variant="outline" className="rounded-l-md rounded-r-none border-r-0">
                    Previous
                  </Button>
                  <Button variant="outline" className="rounded-none border-r-0">
                    1
                  </Button>
                  <Button className="rounded-none border-r-0 bg-blue-600 hover:bg-blue-700 text-white">2</Button>
                  <Button variant="outline" className="rounded-none border-r-0">
                    3
                  </Button>
                  <Button variant="outline" className="rounded-r-md rounded-l-none">
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

// 修改 Header 组件，改进移动端适配
function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-8 lg:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-blue-600 dark:text-blue-400"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="hidden font-bold sm:inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              DevDocs
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              Products
            </Link>
            <Link
              href="/api"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              API Reference
            </Link>
            <Link
              href="/sdks"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              SDKs
            </Link>
            <Link
              href="/guides"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              Guides
            </Link>
            <Link
              href="/quickstarts"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
            >
              Quickstarts
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 dark:text-gray-300">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
          >
            Sign In
          </Button>
        </div>
      </div>
    </header>
  )
}

// 修改 Footer 组件，添加更好的视觉效果
function Footer() {
  return (
    <footer className="w-full border-t bg-white dark:bg-gray-950">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Link href="/" className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-blue-600 dark:text-blue-400"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              DevDocs
            </span>
          </Link>
          <p className="text-center text-sm leading-loose text-gray-500 dark:text-gray-400 md:text-left">
            © 2025 DevDocs Inc. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-end">
          <Link
            href="/terms"
            className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/cookies"
            className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          >
            Cookies
          </Link>
          <Link
            href="/status"
            className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          >
            Status
          </Link>
        </div>
      </div>
    </footer>
  )
}
