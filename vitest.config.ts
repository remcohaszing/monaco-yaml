import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['test/setup.ts'],
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [
        {
          browser: 'chromium'
        }
      ]
    },
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['fillers', 'src']
    }
  }
})
