import React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Wand2 } from "lucide-react"

interface InputWithSendProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  onAnalyze?: () => void
  placeholder?: string
  isLoading?: boolean
  isAnalyzing?: boolean
  minHeight?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
  className?: string
}

export default function InputWithSend({
  value,
  onChange,
  onSend,
  onAnalyze,
  placeholder = "输入文本...",
  isLoading = false,
  isAnalyzing = false,
  minHeight = "80px",
  onKeyDown,
  className,
}: InputWithSendProps) {
  return (
    <div className={`relative ${className}`}>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className={`resize-none pr-10 min-h-[${minHeight}]`}
      />
      <div className="absolute right-2 bottom-2 flex gap-2">
        {onAnalyze && (
          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing || !value.trim()}
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            title="AI 分析并优化需求"
          >
            {isAnalyzing ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"/>
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
          </Button>
        )}
        <Button
          onClick={onSend}
          disabled={isLoading || !value.trim()}
          size="icon"
          className="h-8 w-8"
        >
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"/>
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
