import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";

export default defineConfig([
  // Main build
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.js",
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
      {
        file: "dist/index.esm.js",
        format: "esm",
        sourcemap: true,
      },
    ],
    external: [
      "@modelcontextprotocol/sdk/server/mcp.js",
      "@modelcontextprotocol/sdk/server/index.js",
      "@modelcontextprotocol/sdk/server/stdio.js",
      "@modelcontextprotocol/sdk/server/streamableHttp.js",
      "@modelcontextprotocol/sdk/types.js",
      "@octokit/rest",
      "@autodev/context-worker",
      "@autodev/context-worker/src/analyzer/CodeCollector",
      "@autodev/context-worker/src/analyzer/analyzers/SymbolAnalyser",
      "@autodev/context-worker/src/base/common/languages/languageService",
      "express",
      "zod",
      "cheerio",
      "turndown",
      "dotenv",
      "ai",
      "@ai-sdk/openai",
      "node:crypto",
      "node:http",
      "node:fs",
      "node:path",
      "node:process",
    ],
    plugins: [
      nodeResolve({
        preferBuiltins: true,
        exportConditions: ['node'],
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: "tsconfig.json",
        sourceMap: true,
        declaration: false,
        module: "ESNext",
        cacheDir: "node_modules/.cache/rollup-typescript",
      }),
    ],
  },
  // AI Agent build
  {
    input: "src/agent.ts",
    output: {
      file: "dist/agent.js",
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
    external: [
      "@modelcontextprotocol/sdk/server/mcp.js",
      "@modelcontextprotocol/sdk/server/index.js",
      "@modelcontextprotocol/sdk/server/stdio.js",
      "@modelcontextprotocol/sdk/server/streamableHttp.js",
      "@modelcontextprotocol/sdk/types.js",
      "@octokit/rest",
      "@autodev/context-worker",
      "@autodev/context-worker/src/analyzer/CodeCollector",
      "@autodev/context-worker/src/analyzer/analyzers/SymbolAnalyser",
      "@autodev/context-worker/src/base/common/languages/languageService",
      "express",
      "zod",
      "cheerio",
      "turndown",
      "dotenv",
      "ai",
      "@ai-sdk/openai",
      "node:crypto",
      "node:http",
      "node:fs",
      "node:path",
      "node:process",
    ],
    plugins: [
      nodeResolve({
        preferBuiltins: true,
        exportConditions: ['node'],
      }),
      commonjs(),
      json(),
      typescript({
        tsconfig: "tsconfig.json",
        sourceMap: true,
        declaration: false,
        module: "ESNext",
        cacheDir: "node_modules/.cache/rollup-typescript",
      }),
    ],
  },
  // Type definitions
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.d.ts",
      format: "es",
    },
    external: [
      "@modelcontextprotocol/sdk",
      "@octokit/rest",
      "@autodev/context-worker",
      "express",
      "zod",
      "cheerio",
      "turndown",
      "dotenv",
      "ai",
      "@ai-sdk/openai",
    ],
    plugins: [dts()],
  },
]);
