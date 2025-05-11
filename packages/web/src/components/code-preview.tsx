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
      if (language.toLowerCase() === "html") {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>HTML Preview</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  padding: 0;
                  margin: 0;
                }
              </style>
            </head>
            <body>
              ${code}
            </body>
          </html>
        `

        iframeRef.current.srcdoc = htmlContent
        setTimeout(() => setIsLoading(false), 300)
        return
      }

      if (!["jsx", "tsx", "js", "ts"].includes(language.toLowerCase())) {
        setError(`Cannot preview ${language} code. Only JSX/TSX components and HTML can be previewed.`)
        setIsLoading(false)
        return
      }

      const transpiledCode = transpileCode(code)
      const renderScript = createRenderScript(transpiledCode)

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
            <script>
              try {
                ${renderScript}
              } catch (err) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'preview-error';
                errorDiv.innerHTML = '<h3>Component Error</h3><p>' + err.message + '</p>';
                document.body.appendChild(errorDiv);
                console.error(err);
              }
            </script>
          </body>
        </html>
      `

      // Use srcdoc instead of directly accessing the iframe document
      iframeRef.current.srcdoc = htmlContent

      // Set loading to false after a reasonable delay to ensure scripts are loaded
      setTimeout(() => setIsLoading(false), 600)
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

