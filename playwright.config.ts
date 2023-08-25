import { defineConfig } from '@playwright/test'
import { createServer } from 'playwright-monaco'

export default defineConfig({
  expect: { timeout: 10_000 },
  timeout: 60_000,
  use: {
    baseURL: await createServer({
      setup: './test/setup',
      yaml: './yaml.worker'
    }),
    colorScheme: 'dark'
  }
})
