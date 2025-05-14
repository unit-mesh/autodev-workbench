import React, { useState } from "react"
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
}

export default function InputWithSend({
  value,
  onChange,
  onSend,
  onAnalyze,
  keywordsAnalyze = false,
  placeholder = "输入文本...",
  isLoading = false,
  isAnalyzing = false,
  minHeight = "80px",
  onKeyDown,
  className,
  systemPrompt,
}: InputWithSendProps) {
  const [isAnalyzingKeywords, setIsAnalyzingKeywords] = useState(false);
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);

  const handleSend = async () => {
    if (!keywordsAnalyze || !value.trim()) {
      onSend();
      return;
    }

    setIsAnalyzingKeywords(true);
    try {
      const keywordPrompt = `
Please analyze the following text and extract the key domain terms and concepts. 
Return only a JSON array of strings with the extracted keywords.
For example: ["term1", "term2", "term3"]

Text to analyze:
${value}
`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
            { role: "user" as const, content: keywordPrompt }
          ],
        }),
      });

      if (!response.ok) {
        console.error("Failed to analyze keywords");
        onSend(); // Call onSend even if keyword analysis fails
        return;
      }

      const data = await response.json();
      try {
        let keywords: string[] = [];
        const responseText = data.text;

        const cleanedText = responseText.replace(/```[\s\S]*?```/g, (match: string) => {
          return match.replace(/```[\w]*\n|\n```/g, '');
        });

        if (cleanedText.includes("[") && cleanedText.includes("]")) {
          const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            try {
              keywords = JSON.parse(jsonMatch[0]);
            } catch (e) {
              console.error("Error parsing JSON array:", e);
            }
          }
        }

        if (keywords.length === 0) {
          keywords = cleanedText
            .split(/[,\n]/)
            .map((k: string) => k.trim())
            .filter((k: string) => k && !k.startsWith('"') && !k.startsWith('[') && !k.startsWith(']'));
        }

        setExtractedKeywords(keywords);
      } catch (error) {
        console.error("Error parsing keywords:", error);
      } finally {
        onSend();
      }
    } catch (error) {
      console.error("Error analyzing keywords:", error);
      onSend(); // Call onSend if there's any error
    } finally {
      setIsAnalyzingKeywords(false);
    }
  };

  return (
    <div className="flex flex-col">
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
              {isLoading ? (
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
            {isLoading || isAnalyzingKeywords ? (
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

