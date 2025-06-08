import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import copy from "rollup-plugin-copy";
import importAsString from "rollup-plugin-string-import";

export default defineConfig([
  // CLI build
  {
    input: "src/main.ts",
    output: {
      file: "dist/autodev-context-worker.js",
      format: "cjs",
      banner: "#!/usr/bin/env node",
    },
    onwarn(warning, warn) {
      if (warning.code === 'EVAL') return;
      warn(warning);
    },
    plugins: [
      nodeResolve({
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
      importAsString({
        include: ['**/*.scm'],
      }),
      typescript({
        tsconfig: "tsconfig.json",
        importHelpers: true,
        sourceMap: false,
        declaration: false,
      }),
      copy({
        targets: [
          {
            src: 'node_modules/@unit-mesh/treesitter-artifacts/wasm/*.wasm',
            dest: 'dist/tree-sitter-wasms',
          },
          {
            src: 'node_modules/web-tree-sitter/*.wasm',
            dest: 'dist',
          },
          {
            src: 'src/code-search/schemas/indexes/*.scm',
            dest: 'dist/semantic',
          },
        ],
      }),
    ],
  },

  // Library build (CommonJS)
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
    external: [
      "fs", "path", "crypto", "util", "events", "stream", "url", "http", "https",
      "zlib", "querystring", "child_process", "os", "tty", "readline",
      "@unit-mesh/treesitter-artifacts", "web-tree-sitter", "cheerio", "jsdom",
      "@mozilla/readability", "node-fetch", "js-yaml", "protobufjs",
      "@autodev/worker-core", "@autodev/worker-protobuf"
    ],
    onwarn(warning, warn) {
      if (warning.code === 'EVAL') return;
      warn(warning);
    },
    plugins: [
      nodeResolve({
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
      importAsString({
        include: ['**/*.scm'],
      }),
      typescript({
        tsconfig: "tsconfig.json",
        importHelpers: true,
        sourceMap: true,
        declaration: false,
      }),
    ],
  },

  // Library build (ES Module)
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true,
    },
    external: [
      "fs", "path", "crypto", "util", "events", "stream", "url", "http", "https",
      "zlib", "querystring", "child_process", "os", "tty", "readline",
      "@unit-mesh/treesitter-artifacts", "web-tree-sitter", "cheerio", "jsdom",
      "@mozilla/readability", "node-fetch", "js-yaml", "protobufjs",
      "@autodev/worker-core", "@autodev/worker-protobuf"
    ],
    onwarn(warning, warn) {
      if (warning.code === 'EVAL') return;
      warn(warning);
    },
    plugins: [
      nodeResolve({
        preferBuiltins: true,
      }),
      commonjs(),
      json(),
      importAsString({
        include: ['**/*.scm'],
      }),
      typescript({
        tsconfig: "tsconfig.json",
        importHelpers: true,
        sourceMap: true,
        declaration: false,
      }),
    ],
  },

  // Type definitions
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.d.ts",
      format: "esm",
    },
    external: [
      "fs", "path", "crypto", "util", "events", "stream", "url", "http", "https",
      "zlib", "querystring", "child_process", "os", "tty", "readline",
      "@unit-mesh/treesitter-artifacts", "web-tree-sitter", "cheerio", "jsdom",
      "@mozilla/readability", "node-fetch", "js-yaml", "protobufjs",
      "@autodev/worker-core", "@autodev/worker-protobuf"
    ],
    plugins: [
      typescript({
        tsconfig: "tsconfig.json",
        declaration: true,
        declarationDir: "./dist",
        emitDeclarationOnly: true,
      }),
    ],
  }
]);
