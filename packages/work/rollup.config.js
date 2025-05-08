const { defineConfig } = require("rollup");
const typescript = require("@rollup/plugin-typescript").default;
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs").default;
const json = require("@rollup/plugin-json").default;

module.exports = defineConfig({
  input: "src/main.ts",
  output: {
    file: "bin/autodev-work.js",
    format: "cjs",
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
  ],
});
