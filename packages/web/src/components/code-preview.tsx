"use client"

import { useEffect, useRef, useState } from "react"
import { transpileCode, createRenderScript } from "@/lib/code-transpiler"
import { Loader2 } from "lucide-react"

interface CodePreviewProps {
  code: string
  language: string
}

export function CodePreview({ code, language }: CodePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code || !iframeRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      // Only try to render JSX/TSX code
      if (!["jsx", "tsx", "js", "ts"].includes(language.toLowerCase())) {
        setError(`Cannot preview ${language} code. Only JSX/TSX components can be previewed.`)
        setIsLoading(false)
        return
      }

      // Get the iframe document
      const iframe = iframeRef.current
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

      if (!iframeDoc) {
        setError("Could not access iframe document")
        setIsLoading(false)
        return
      }

      // Create HTML content with React and ReactDOM
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Component Preview</title>
            <script src="https://unpkg.com/react@17/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
            <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                padding: 0;
                margin: 0;
              }
              #root {
                padding: 1rem;
              }
              .preview-error {
                color: red;
                padding: 20px;
                border: 1px solid red;
                border-radius: 4px;
                margin: 20px;
              }
            </style>
          </head>
          <body>
            <div id="root">
              <div style="display: flex; justify-content: center; align-items: center; height: 100px;">
                <p>Loading preview...</p>
              </div>
            </div>
          </body>
        </html>
      `

      // Write the initial HTML
      iframeDoc.open()
      iframeDoc.write(htmlContent)
      iframeDoc.close()

      // Transpile the code
      const transpiledCode = transpileCode(code)

      // Create a script to render the component
      const renderScript = createRenderScript(transpiledCode)

      // Add the script to the iframe
      setTimeout(() => {
        try {
          const scriptElement = iframeDoc.createElement("script")
          scriptElement.textContent = renderScript
          iframeDoc.body.appendChild(scriptElement)
          setIsLoading(false)
        } catch (err) {
          setError(`Error rendering component: ${err instanceof Error ? err.message : String(err)}`)
          setIsLoading(false)
        }
      }, 300) // Small delay to ensure React and ReactDOM are loaded
    } catch (err) {
      setError(`Error setting up preview: ${err instanceof Error ? err.message : String(err)}`)
      setIsLoading(false)
    }
  }, [code, language])

  return (
    <div className="relative w-full h-full border rounded-md bg-white">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <div className="flex flex-col items-center">
            <Loader2 size={24} className="animate-spin mb-2" />
            <p className="text-sm text-gray-500">Rendering preview...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
            <h3 className="text-lg font-semibold mb-2">Preview Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <iframe ref={iframeRef} className="w-full h-full" sandbox="allow-scripts" title="Component Preview" />
    </div>
  )
}
