import { defineConfig } from 'vitest/config';

export default defineConfig({
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
