"use client"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Code, Play, Send, Loader2 } from "lucide-react"

// Types
type MessageRole = "user" | "assistant"

interface Message {
  id: string
  role: MessageRole
  content: string
}

export default function AIFrontendGenerator() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "你好！我是 AI 前端代码生成器。请告诉我你想要创建什么样的前端界面，我会为你生成代码。",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState("<div>预览将在这里显示</div>")
  const [activeTab, setActiveTab] = useState("preview")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Update preview when code changes
  useEffect(() => {
    if (previewRef.current && activeTab === "preview") {
      const iframe = previewRef.current
      const document = iframe.contentDocument
      if (document) {
        document.open()
        document.write(generatedCode)
        document.close()
      }
    }
  }, [generatedCode, activeTab])

  const generateAIResponse = async (userMessage: string) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    let aiResponse = "我已经为你生成了一个简单的按钮组件。你可以在右侧查看预览和代码。"
    let code = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>生成的前端</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f9fafb;
    }
    .container {
      text-align: center;
    }
    .button {
      background-color: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #2563eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>你好，世界！</h1>
    <p>这是一个由 AI 生成的简单前端界面</p>
    <button class="button">点击我</button>
  </div>
  <script>
    document.querySelector('.button').addEventListener('click', () => {
      alert('按钮被点击了！');
    });
  </script>
</body>
</html>
    `

    // If user asks for something specific, we could have different templates
    if (userMessage.includes("登录") || userMessage.includes("login")) {
      aiResponse = "我已经为你生成了一个登录表单。你可以在右侧查看预览和代码。"
      code = `
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>登录表单</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f9fafb;
    }
    .login-form {
      background-color: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
    }
    .form-title {
      margin-top: 0;
      color: #111827;
      text-align: center;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #374151;
      font-size: 0.875rem;
    }
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 1rem;
    }
    .submit-button {
      width: 100%;
      padding: 0.75rem;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    .submit-button:hover {
      background-color: #2563eb;
    }
    .form-footer {
      text-align: center;
      margin-top: 1rem;
      font-size: 0.875rem;
      color: #6b7280;
    }
    .form-footer a {
      color: #3b82f6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="login-form">
    <h2 class="form-title">登录账户</h2>
    <form id="login-form">
      <div class="form-group">
        <label for="email">邮箱</label>
        <input type="email" id="email" required>
      </div>
      <div class="form-group">
        <label for="password">密码</label>
        <input type="password" id="password" required>
      </div>
      <button type="submit" class="submit-button">登录</button>
    </form>
    <div class="form-footer">
      还没有账户？<a href="#">注册</a>
    </div>
  </div>
  <script>
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // 这里通常会有 API 调用来验证登录
      console.log('登录尝试:', { email, password });
      alert('登录表单已提交！在实际应用中，这里会发送到服务器验证。');
    });
  </script>
</body>
</html>
      `
    }

    setGeneratedCode(code)

    const newAssistantMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: aiResponse,
    }

    setMessages((prev) => [...prev, newAssistantMessage])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() === "" || isLoading) return

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, newUserMessage])
    setInput("")

    await generateAIResponse(input)
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Chat Section - Left Side */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            AI 聊天
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="描述你想要的前端界面..."
              className="flex-1 resize-none"
              rows={2}
            />
            <Button type="submit" disabled={isLoading} className="self-end">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>

      {/* Preview/Code Section - Right Side */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview" className="flex items-center">
                <Play className="mr-2 h-4 w-4" />
                预览
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center">
                <Code className="mr-2 h-4 w-4" />
                代码
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="preview" className="flex-1 p-4 overflow-auto">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <iframe ref={previewRef} title="Preview" className="w-full h-full border-0" sandbox="allow-scripts" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="flex-1 p-4 overflow-auto">
            <Card className="h-full">
              <CardContent className="p-4">
                <pre className="text-sm overflow-auto h-full">
                  <code>{generatedCode}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
