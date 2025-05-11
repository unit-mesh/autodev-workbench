// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import * as Babel from "@babel/standalone"

export function transpileCode(code: string): string {
  try {
    // Add React import if it's missing
    let codeWithReact = code
    if (!code.includes("import React") && !code.includes('from "react"')) {
      codeWithReact = `import React from 'react';\n${code}`
    }

    // Transpile the code
    const result = Babel.transform(codeWithReact, {
      presets: ["react", "typescript"],
      filename: "component.tsx",
    })

    return result.code || ""
  } catch (error) {
    console.error("Error transpiling code:", error)
    return `// Error transpiling code: ${error instanceof Error ? error.message : String(error)}`
  }
}

// Create a script that will render the component in the iframe
export function createRenderScript(transpiledCode: string): string {
  return `
    try {
      ${transpiledCode}
      
      // Find the default export (the component)
      const Component = (() => {
        // Look for export default statements
        const defaultExportMatch = transpiledCode.match(/export\\s+default\\s+([A-Za-z0-9_]+)/);
        if (defaultExportMatch && defaultExportMatch[1]) {
          return eval(defaultExportMatch[1]);
        }
        
        // If no default export found, look for the last defined component
        const componentMatch = transpiledCode.match(/function\\s+([A-Za-z0-9_]+)\\s*\\(/g);
        if (componentMatch) {
          const lastComponent = componentMatch[componentMatch.length - 1]
            .replace('function', '')
            .replace('(', '')
            .trim();
          return eval(lastComponent);
        }
        
        // If still not found, return a placeholder
        return () => React.createElement('div', null, 'No component found');
      })();
      
      // Render the component
      ReactDOM.render(
        React.createElement(Component),
        document.getElementById('root')
      );
    } catch (error) {
      document.getElementById('root').innerHTML = \`
        <div style="color: red; padding: 20px; border: 1px solid red; border-radius: 4px; margin: 20px;">
          <h3>Error Rendering Component</h3>
          <pre>\${error.message}</pre>
        </div>
      \`;
      console.error('Error rendering component:', error);
    }
  `
}
