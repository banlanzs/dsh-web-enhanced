import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    server: {
      deps: {
        // Node loads the @deepseek-ai ESM packages natively (verified working);
        // vite's transform pipeline chokes on their combined dependency graph.
        external: [/@deepseek-ai\//u],
      },
    },
  },
})
