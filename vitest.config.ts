import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue()] as any,
  resolve: {
    alias: {
      '~': root,
      '@': root,
      'virtual:quiz-map': fileURLToPath(new URL('tests/__stubs__/quiz-map.ts', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
