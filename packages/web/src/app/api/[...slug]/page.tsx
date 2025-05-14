import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import {
  ChevronRight,
  Copy,
  Search,
  AlertTriangle,
  Info,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Sun,
  Moon,
} from "lucide-react"
import DocSidebar from "@/components/doc-sidebar"
import TableOfContents from "@/components/table-of-contents"
import CodeBlock from "@/components/code-block"

export default function ApiDocPage({ params }: { params: { slug: string[] } }) {
  // This would normally be fetched from a CMS or API
  const apiEndpoint = {
    name: "List Users",
    description: "Returns a list of users for your organization.",
    method: "GET",
    path: "/v1/users",
    version: "2.5",
    lastUpdated: "May 10, 2025",
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 container flex flex-col md:flex-row">
        <DocSidebar className="hidden md:block w-64 flex-shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto py-6 pr-4" />
        <main className="flex-1 min-w-0 py-6 md:px-8">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "API Reference", href: "/api" },
              { label: "Users", href: "/api/users" },
              { label: "List Users", href: "#" },
            ]}
          />
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{apiEndpoint.name}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline" className="text-sm font-medium">
                      v{apiEndpoint.version}
                    </Badge>
                    <span className="text-sm text-muted-foreground">Updated {apiEndpoint.lastUpdated}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in API Explorer
                  </Button>
                </div>
              </div>
              <p className="text-lg text-muted-foreground">{apiEndpoint.description}</p>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
              <Badge className="bg-green-600 hover:bg-green-600">{apiEndpoint.method}</Badge>
              <code className="font-mono text-sm">{apiEndpoint.path}</code>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy</span>
              </Button>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This endpoint uses cursor-based pagination via the <code>starting_after</code> and{" "}
                <code>ending_before</code> parameters.
              </AlertDescription>
            </Alert>

            <div className="space-y-6">
              <h2 className="text-xl font-semibold tracking-tight" id="request-parameters">
                Request Parameters
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Parameter</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Type</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Required</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">limit</code>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">integer</code>
                      </td>
                      <td className="py-3 px-4 align-top">No</td>
                      <td className="py-3 px-4 align-top">
                        <p className="text-sm">
                          A limit on the number of objects to be returned. Limit can range between 1 and 100, and the
                          default is 10.
                        </p>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">starting_after</code>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">string</code>
                      </td>
                      <td className="py-3 px-4 align-top">No</td>
                      <td className="py-3 px-4 align-top">
                        <p className="text-sm">
                          A cursor for use in pagination. <code>starting_after</code> is an object ID that defines your
                          place in the list.
                        </p>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">ending_before</code>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">string</code>
                      </td>
                      <td className="py-3 px-4 align-top">No</td>
                      <td className="py-3 px-4 align-top">
                        <p className="text-sm">
                          A cursor for use in pagination. <code>ending_before</code> is an object ID that defines your
                          place in the list.
                        </p>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">role</code>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">string</code>
                      </td>
                      <td className="py-3 px-4 align-top">No</td>
                      <td className="py-3 px-4 align-top">
                        <p className="text-sm">
                          Filter users by role. Possible values are <code>admin</code>, <code>member</code>, or{" "}
                          <code>guest</code>.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-semibold tracking-tight" id="response">
                Response
              </h2>
              <p>
                Returns a list of user objects. The list is returned as a collection resource wrapped in a{" "}
                <code>data</code> array.
              </p>

              <Tabs defaultValue="json">
                <TabsList>
                  <TabsTrigger value="json">JSON Response</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                </TabsList>
                <TabsContent value="json">
                  <CodeBlock
                    language="json"
                    code={`{
  "object": "list",
  "data": [
    {
      "id": "usr_1234567890",
      "object": "user",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "admin",
      "created_at": 1620000000,
      "updated_at": 1620000000
    },
    {
      "id": "usr_0987654321",
      "object": "user",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "member",
      "created_at": 1620000000,
      "updated_at": 1620000000
    }
  ],
  "has_more": false,
  "url": "/v1/users"
}`}
                  />
                </TabsContent>
                <TabsContent value="curl">
                  <CodeBlock
                    language="bash"
                    code={`curl https://api.example.com/v1/users \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -G \\
  -d limit=10 \\
  -d role=admin`}
                  />
                </TabsContent>
                <TabsContent value="python">
                  <CodeBlock
                    language="python"
                    code={`import requests

url = "https://api.example.com/v1/users"
headers = {"Authorization": "Bearer YOUR_API_KEY"}
params = {"limit": 10, "role": "admin"}

response = requests.get(url, headers=headers, params=params)
users = response.json()

for user in users["data"]:
    print(f"{user['name']} - {user['email']}")`}
                  />
                </TabsContent>
                <TabsContent value="javascript">
                  <CodeBlock
                    language="javascript"
                    code={`const fetchUsers = async () => {
  const response = await fetch('https://api.example.com/v1/users?limit=10&role=admin', {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  });
  
  const data = await response.json();
  
  data.data.forEach(user => {
    console.log(\`\${user.name} - \${user.email}\`);
  });
};

fetchUsers();`}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-semibold tracking-tight" id="errors">
                Errors
              </h2>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This request may return error responses in certain situations. See the{" "}
                  <Link href="/api/errors" className="underline">
                    Errors documentation
                  </Link>{" "}
                  for details.
                </AlertDescription>
              </Alert>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Code</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">401</code>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <p className="text-sm">Authentication error. Your API key may be invalid or expired.</p>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">403</code>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <p className="text-sm">
                          Permission error. Your API key may not have the necessary permissions.
                        </p>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4 align-top">
                        <code className="font-mono text-sm">429</code>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <p className="text-sm">
                          Too many requests. You have exceeded the rate limit. See{" "}
                          <Link href="/api/rate-limits" className="underline">
                            Rate Limits
                          </Link>{" "}
                          for details.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Edit on GitHub
                  </Button>
                  <Button variant="outline" size="sm">
                    Report an issue
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Was this page helpful?</span>
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Yes
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    No
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <TableOfContents
          className="hidden lg:block w-64 flex-shrink-0 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto py-6 pl-4"
          items={[
            { id: "request-parameters", label: "Request Parameters" },
            { id: "response", label: "Response" },
            { id: "errors", label: "Errors" },
          ]}
        />
      </div>
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
              className="text-sm font-medium text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 py-1"
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
          <form className="hidden md:flex relative w-full max-w-sm items-center">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search documentation..."
              className="w-full pl-8 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
              autoComplete="off"
            />
          </form>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600 dark:text-gray-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M12 3v5" />
                <path d="M5 8h14" />
                <path d="M18 8a2 2 0 0 1 2 2v10a2 2 0 0 1-2-2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2" />
                <path d="M12 16v-4" />
                <path d="M9 16h6" />
              </svg>
              <span className="sr-only">Version</span>
            </Button>
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
      </div>
    </header>
  )
}

// 修改 Breadcrumbs 组件，添加更好的视觉效果
function Breadcrumbs({ items }: { items: { label: string; href: string }[] }) {
  return (
    <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6 overflow-x-auto pb-2 scrollbar-none">
      {items.map((item, index) => (
        <div key={index} className="flex items-center whitespace-nowrap">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />}
          {index === items.length - 1 ? (
            <span className="font-medium text-gray-900 dark:text-gray-100">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
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
