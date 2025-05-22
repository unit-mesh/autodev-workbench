import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Wand2 } from "lucide-react"

interface InputWithSendProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  onAnalyze?: () => void
  keywordsAnalyze?: boolean
  placeholder?: string
  isLoading?: boolean
  isAnalyzing?: boolean
  minHeight?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
  className?: string | ""
  systemPrompt?: string
  onKeywordsExtracted?: (keywords: string[]) => void // 新增回调函数属性
}

export default function AwarenessInput({
  value,
  onChange,
  onSend,
  onAnalyze,
  keywordsAnalyze = false,
  placeholder = "输入文本...",
  isLoading = false,
  isAnalyzing = false,
  minHeight = "120px",
  onKeyDown,
  className,
  systemPrompt,
  onKeywordsExtracted, // 添加新属性
}: InputWithSendProps) {
  const [isAnalyzingKeywords, setIsAnalyzingKeywords] = useState(false);
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e);
    if (textareaRef.current) {
      textareaRef.current.setAttribute('data-empty', e.target.value === '' ? 'true' : 'false');
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.setAttribute('data-empty', value === '' ? 'true' : 'false');
    }
  }, [value]);

  const handleSend = async () => {
    if (!keywordsAnalyze || !value.trim()) {
      onSend();
      return;
    }

    setIsAnalyzingKeywords(true);
    try {
      const response = await fetch("/api/concepts/actions/extract-keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: value,
          systemPrompt: systemPrompt,
        }),
      });

      if (!response.ok) {
        console.error("Failed to analyze keywords");
        onSend();
        return;
      }

      const data = await response.json();
      if (data.success && data.keywords) {
        setExtractedKeywords(data.keywords);
        if (onKeywordsExtracted && data.keywords.length > 0) {
          onKeywordsExtracted(data.keywords);
        }
      }
    } catch (error) {
      console.error("Error analyzing keywords:", error);
    } finally {
      setIsAnalyzingKeywords(false);
      onSend();
    }
  };

  return (
    <div className="flex flex-col">
      <div className={`relative ${className}`}>
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          className={`resize-none pr-20 min-h-[${minHeight}]`}
          data-empty={value === ''}
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
            onClick={handleSend}
            disabled={isLoading || isAnalyzingKeywords || !value.trim()}
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

      {keywordsAnalyze && extractedKeywords.length > 0 && (
        <div className="mt-2 text-sm">
          <div className="flex flex-wrap gap-1">
            {extractedKeywords.map((keyword, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
