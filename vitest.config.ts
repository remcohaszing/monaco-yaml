import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  optimizeDeps: {
    include: [
      'jsonc-parser',
      'monaco-worker-manager/worker',
      'path-browserify',
      'prettier/plugins/yaml',
      'prettier/standalone',
      'vscode-languageserver-textdocument',
      'vscode-languageserver-types',
      'vscode-uri',
      'yaml'
    ]
  },
  test: {
    setupFiles: ['test/setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      screenshotFailures: false,
      instances: [
        {
          browser: 'chromium'
        }
      ]
    },
    coverage: {
      enabled: true
    }
  }
})
