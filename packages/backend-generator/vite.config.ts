import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        cli: resolve(__dirname, 'src/cli.ts'),
      },
      name: 'BackendGenerator',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [
        'commander',
        'zod',
        'chalk',
        'fs-extra',
        'handlebars',
        'path',
        'fs',
      ],
    },
    target: 'node14',
  },
  test: {
    globals: true,
    environment: 'node',
  },
}); 