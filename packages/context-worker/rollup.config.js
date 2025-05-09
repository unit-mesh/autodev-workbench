const { defineConfig } = require("rollup");
const typescript = require("@rollup/plugin-typescript").default;
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs").default;
const json = require("@rollup/plugin-json").default;
const copy = require("rollup-plugin-copy");
const importAsString = require("rollup-plugin-string-import").default;

module.exports = defineConfig({
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
