import React from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import GenifyMarkdownRender from "@/components/markdown/GenifyMarkdownRender"

interface CodeBlock {
  language: string
  code: string
}

interface CodeBlockRendererProps {
  codeBlocks: CodeBlock[] | null
  content?: string
}

export function CodeBlockRenderer({ codeBlocks, content }: CodeBlockRendererProps) {
  if (codeBlocks) {
    return (
      <>
        {codeBlocks.map((block, blockIndex) => (
          <div key={blockIndex} className="mb-3 last:mb-0 overflow-x-auto">
            <SyntaxHighlighter
              language={block.language}
              style={vscDarkPlus}
              customStyle={{
                fontSize: "0.875rem",
                maxHeight: "400px",
                overflow: "auto",
              }}
            >
              {block.code}
            </SyntaxHighlighter>
          </div>
        ))}
      </>
    )
  }

  return (
    <div className="overflow-y-auto max-h-[400px]">
      {content ? (
        <GenifyMarkdownRender content={content} />
      ) : (
        <div className="text-sm text-slate-500 italic">无可用内容</div>
      )}
    </div>
  )
}
