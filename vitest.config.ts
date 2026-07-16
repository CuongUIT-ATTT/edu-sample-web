import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/actions/**', 'src/lib/**'],
      exclude: ['src/lib/prisma.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
