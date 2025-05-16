import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import copy from "rollup-plugin-copy";
import importAsString from "rollup-plugin-string-import";

export default defineConfig({
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
      declaration: true,
      declarationDir: "./dist/types",
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
});
