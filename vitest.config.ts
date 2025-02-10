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
      include: ['src/**', 'fillers/**', 'index.js', 'yaml.worker.js'],
      exclude: ['node_modules/**'],
      excludeAfterRemap: true
    }
  }
})
