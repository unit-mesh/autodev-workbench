const { defineConfig } = require("rollup");
const typescript = require("@rollup/plugin-typescript").default;
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs").default;
const json = require("@rollup/plugin-json").default;
const copy = require("rollup-plugin-copy");

module.exports = defineConfig({
  input: "src/main.ts",
  output: {
    file: "bin/autodev-work.js",
    format: "cjs",
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
    typescript({
      tsconfig: "tsconfig.json",
      importHelpers: true,
      sourceMap: false,
    }),
    copy({
      targets: [
        {
          src: 'node_modules/@unit-mesh/treesitter-artifacts/wasm/*.wasm',
          dest: 'bin/tree-sitter-wasms',
        },
        {
          src: 'node_modules/web-tree-sitter/*.wasm',
          dest: 'bin',
        },
        {
          src: 'src/code-search/schemas/indexes/*.scm',
          dest: 'bin/semantic',
        },
      ],
    }),
  ],
});
