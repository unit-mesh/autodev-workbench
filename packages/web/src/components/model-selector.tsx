"use client"

import { useState } from "react"
import { Check, ChevronDown, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const models = [
  { name: "DeekSeek", value: "deepseek" },
  { name: "GPT-4o", value: "gpt-4o" },
  { name: "GLM-4", value: "glm-4" },
  { name: "GLM-4-Air", value: "glm-4-air" },
]

export function ModelSelector() {
  const [selectedModel, setSelectedModel] = useState(models[0])
  const [apiEndpoint, setApiEndpoint] = useState("https://api.openai.com/v1")
  const [apiKey, setApiKey] = useState("")
  const [providerType, setProviderType] = useState("openai")

  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-1 mr-2">
            <span className="hidden sm:inline">{selectedModel.name}</span>
            <span className="inline sm:hidden">模型</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>选择模型</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {models.map((model) => (
              <DropdownMenuItem
                key={model.value}
                onClick={() => setSelectedModel(model)}
                className="flex items-center justify-between"
              >
                {model.name}
                {selectedModel.value === model.value && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Settings className="mr-2 h-4 w-4" />
                <span>高级配置</span>
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>模型配置</DialogTitle>
                <DialogDescription>配置 AI 模型接口参数，支持 OpenAI 和智谱 API</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <RadioGroup
                  defaultValue={providerType}
                  onValueChange={setProviderType}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="openai" id="openai" />
                    <Label htmlFor="openai">OpenAI</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="zhipu" id="zhipu" />
                    <Label htmlFor="zhipu">智谱 AI</Label>
                  </div>
                </RadioGroup>

                <div className="grid gap-2">
                  <Label htmlFor="endpoint">API 端点</Label>
                  <Input
                    id="endpoint"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    placeholder={
                      providerType === "openai" ? "https://api.openai.com/v1" : "https://open.bigmodel.cn/api/paas/v4"
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apiKey">API 密钥</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={providerType === "openai" ? "sk-..." : "zhipu-..."}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">保存配置</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
