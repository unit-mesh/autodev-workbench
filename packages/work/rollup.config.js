const { defineConfig } = require("rollup");
const typescript = require("@rollup/plugin-typescript").default;
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs").default;

module.exports = defineConfig({
  input: "src/main.ts",
  output: {
    file: "bin/autodev-work.js",
    format: "cjs",
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({
      tsconfig: "tsconfig.json",
    }),
  ],
});
