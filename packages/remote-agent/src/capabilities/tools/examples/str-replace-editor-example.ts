/**
 * Example usage of the str-replace-editor tool
 * 
 * This demonstrates how to use the advanced file editing capabilities
 * that provide precise string replacement and insertion with line number support.
 */

import { installStrReplaceEditorTool } from "../str-replace-editor";

// Example of how to use the tool in an agent
export async function demonstrateStrReplaceEditor() {
  let toolHandler: any;
  
  // Install the tool
  const installer = (name: string, description: string, schema: any, handler: any) => {
    console.log(`Installing tool: ${name}`);
    console.log(`Description: ${description}`);
    toolHandler = handler;
  };
  
  installStrReplaceEditorTool(installer);
  
  // Example 1: String replacement
  console.log("\n=== Example 1: String Replacement ===");
  const replaceResult = await toolHandler({
    command: "str_replace",
    path: "example.js",
    old_str_1: "const oldFunction = () => {",
    new_str_1: "const newFunction = () => {",
    old_str_start_line_number_1: 5,
    old_str_end_line_number_1: 5,
    create_backup: true,
    dry_run: true // Preview changes first
  });
  
  console.log("Replace result:", JSON.parse(replaceResult.content[0].text));
  
  // Example 2: Multiple replacements in one operation
  console.log("\n=== Example 2: Multiple Replacements ===");
  const multiReplaceResult = await toolHandler({
    command: "str_replace",
    path: "example.js",
    // First replacement
    old_str_1: "import React from 'react';",
    new_str_1: "import React, { useState } from 'react';",
    old_str_start_line_number_1: 1,
    old_str_end_line_number_1: 1,
    // Second replacement
    old_str_2: "export default function Component() {",
    new_str_2: "export default function EnhancedComponent() {",
    old_str_start_line_number_2: 10,
    old_str_end_line_number_2: 10,
    create_backup: true
  });
  
  console.log("Multi-replace result:", JSON.parse(multiReplaceResult.content[0].text));
  
  // Example 3: Content insertion
  console.log("\n=== Example 3: Content Insertion ===");
  const insertResult = await toolHandler({
    command: "insert",
    path: "example.js",
    insert_line_1: 0, // Insert at beginning
    new_str_1: "// This file was auto-generated\n// Do not edit manually",
    insert_line_2: 5, // Insert after line 5
    new_str_2: "\n// Helper function\nconst helper = () => {};",
    create_backup: false
  });
  
  console.log("Insert result:", JSON.parse(insertResult.content[0].text));
  
  // Example 4: Multi-line replacement
  console.log("\n=== Example 4: Multi-line Replacement ===");
  const multiLineResult = await toolHandler({
    command: "str_replace",
    path: "example.js",
    old_str_1: `function oldImplementation() {
  return "old";
}`,
    new_str_1: `function newImplementation() {
  // Enhanced implementation
  return "new and improved";
}`,
    old_str_start_line_number_1: 15,
    old_str_end_line_number_1: 17,
    create_backup: true
  });
  
  console.log("Multi-line result:", JSON.parse(multiLineResult.content[0].text));
}

// Tool capabilities summary
export const STR_REPLACE_EDITOR_CAPABILITIES = {
  name: "str-replace-editor",
  description: "Advanced file editor for precise string replacements and insertions",
  
  features: [
    "Exact string matching with line number validation",
    "Multiple replacements in a single operation",
    "Content insertion at specific line positions", 
    "Automatic backup creation",
    "Dry-run mode for previewing changes",
    "Multi-line content support",
    "Security validation (workspace boundary checks)",
    "Comprehensive error handling"
  ],
  
  useCases: [
    "Refactoring code with precise control",
    "Automated code generation and modification",
    "Configuration file updates",
    "Template processing",
    "Code migration and transformation",
    "Adding imports, comments, or documentation",
    "Fixing specific code patterns"
  ],
  
  advantages: [
    "More precise than simple find-replace",
    "Safer than overwriting entire files",
    "Supports complex multi-step edits",
    "Maintains file integrity with validation",
    "Provides detailed operation feedback",
    "Handles edge cases gracefully"
  ]
};

// Example tool parameters for common operations
export const COMMON_OPERATIONS = {
  // Add import statement at the top
  addImport: {
    command: "insert",
    insert_line_1: 0,
    new_str_1: "import { newModule } from 'new-package';"
  },
  
  // Replace function name
  renameFunction: {
    command: "str_replace",
    old_str_1: "function oldName(",
    new_str_1: "function newName(",
    // Line numbers would be determined dynamically
  },
  
  // Add JSDoc comment
  addDocumentation: {
    command: "insert",
    new_str_1: `/**
 * Function description
 * @param {string} param - Parameter description
 * @returns {string} Return value description
 */`
    // insert_line would be set to line before function
  },
  
  // Update configuration
  updateConfig: {
    command: "str_replace",
    old_str_1: '"version": "1.0.0"',
    new_str_1: '"version": "1.1.0"'
    // Line numbers would be determined by parsing the file
  }
};
