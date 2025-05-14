"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Menu,
  Home,
  Book,
  Code,
  Settings,
  MessageSquare,
  Bell,
  Sun,
  Moon,
  Laptop,
  User,
  LogOut,
  X,
} from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useState } from "react"

interface MainHeaderProps {
  toggleSidebar: () => void
  toggleAssistant: () => void
  toggleSearch: () => void
  goToDashboard: () => void
  isAssistantOpen: boolean
  theme: "light" | "dark" | "system"
  setTheme: (theme: "light" | "dark" | "system") => void
}

export function MainHeader({
  toggleSidebar,
  toggleAssistant,
  toggleSearch,
  goToDashboard,
  isAssistantOpen,
  theme,
  setTheme,
}: MainHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isTablet = useMediaQuery("(min-width: 768px)")

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">切换侧边栏</span>
        </Button>

        <Link href="/" onClick={goToDashboard} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
            <Book className="h-4 w-4" />
          </div>
          <span className="hidden font-bold md:inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
            DevDocs
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={goToDashboard} className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            <span>仪表盘</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <Book className="h-4 w-4" />
            <span>文档库</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <Code className="h-4 w-4" />
            <span>API参考</span>
          </Button>
        </nav>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2 w-72" onClick={toggleSearch}>
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">搜索文档...</span>
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSearch}>
          <Search className="h-5 w-5" />
          <span className="sr-only">搜索</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="sr-only">通知</span>
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between p-2">
              <h2 className="font-medium">通知</h2>
              <Button variant="ghost" size="sm" className="text-xs">
                全部标为已读
              </Button>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              <div className="p-3 hover:bg-muted cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-sm font-medium">API文档已更新</p>
                    <p className="text-xs text-muted-foreground">用户认证API已更新到v2.5版本</p>
                    <p className="text-xs text-muted-foreground mt-1">10分钟前</p>
                  </div>
                </div>
              </div>
              <div className="p-3 hover:bg-muted cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-sm font-medium">您的问题已得到回复</p>
                    <p className="text-xs text-muted-foreground">李明回复了您关于OAuth集成的问题</p>
                    <p className="text-xs text-muted-foreground mt-1">1小时前</p>
                  </div>
                </div>
              </div>
              <div className="p-3 hover:bg-muted cursor-pointer bg-muted/50">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-gray-300"></div>
                  <div>
                    <p className="text-sm font-medium">新教程已发布</p>
                    <p className="text-xs text-muted-foreground">查看"使用GraphQL API的最佳实践"</p>
                    <p className="text-xs text-muted-foreground mt-1">昨天</p>
                  </div>
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant={isAssistantOpen ? "secondary" : "ghost"}
          size="icon"
          onClick={toggleAssistant}
          className="relative"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="sr-only">AI助手</span>
          {!isAssistantOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
              AI
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/abstract-geometric-shapes.png" alt="用户头像" />
                <AvatarFallback>用户</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">张开发</p>
                <p className="text-xs text-muted-foreground">zhang@example.com</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>个人资料</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>设置</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>浅色模式</span>
              {theme === "light" && <Badge className="ml-auto">当前</Badge>}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>深色模式</span>
              {theme === "dark" && <Badge className="ml-auto">当前</Badge>}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme("system")}>
              <Laptop className="mr-2 h-4 w-4" />
              <span>系统默认</span>
              {theme === "system" && <Badge className="ml-auto">当前</Badge>}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-background border-b shadow-md z-50 md:hidden animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col p-4 space-y-2">
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => {
                goToDashboard()
                setMobileMenuOpen(false)
              }}
            >
              <Home className="h-4 w-4 mr-2" />
              <span>仪表盘</span>
            </Button>
            <Button variant="ghost" className="justify-start">
              <Book className="h-4 w-4 mr-2" />
              <span>文档库</span>
            </Button>
            <Button variant="ghost" className="justify-start">
              <Code className="h-4 w-4 mr-2" />
              <span>API参考</span>
            </Button>
            <Button variant="ghost" className="justify-start">
              <Settings className="h-4 w-4 mr-2" />
              <span>设置</span>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
