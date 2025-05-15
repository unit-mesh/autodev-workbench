import { defineConfig } from 'vitest/config';

import copy from "rollup-plugin-copy";
import importAsString from "rollup-plugin-string-import";

export default defineConfig({
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  plugins: [
    importAsString({
      include: ['**/*.scm'],
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
  test: {
    setupFiles: 'src/test/vitest.setup.ts',
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
