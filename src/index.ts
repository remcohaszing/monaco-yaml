import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'
import { setMonaco } from 'monaco-languageserver-types'
import { registerMarkerDataProvider } from 'monaco-marker-data-provider'
import { createWorkerManager } from 'monaco-worker-manager'
import { type DiagnosticsOptions, type LanguageServiceDefaults } from 'monaco-yaml'

import { languageId } from './constants.js'
import {
  createCodeActionProvider,
  createCompletionItemProvider,
  createDefinitionProvider,
  createDocumentFormattingEditProvider,
  createDocumentSymbolProvider,
  createHoverProvider,
  createLinkProvider,
  createMarkerDataProvider
} from './languageFeatures.js'
import { type CreateData, type YAMLWorker } from './yaml.worker.js'

// --- YAML configuration and defaults ---------

const diagnosticDefault: DiagnosticsOptions = {
  completion: true,
  customTags: [],
  enableSchemaRequest: false,
  format: true,
  isKubernetes: false,
  hover: true,
  schemas: [],
  validate: true,
  yamlVersion: '1.2'
}

setMonaco(monaco)

export function createLanguageServiceDefaults(
  initialDiagnosticsOptions: DiagnosticsOptions
): LanguageServiceDefaults {
  const onDidChange = new monaco.Emitter<LanguageServiceDefaults>()
  let diagnosticsOptions = initialDiagnosticsOptions

  const languageServiceDefaults: LanguageServiceDefaults = {
    get onDidChange() {
      return onDidChange.event
    },

    get diagnosticsOptions() {
      return diagnosticsOptions
    },

    setDiagnosticsOptions(options) {
      diagnosticsOptions = { ...diagnosticDefault, ...options }
      onDidChange.fire(languageServiceDefaults)
    }
  }

  return languageServiceDefaults
}

export const yamlDefaults = createLanguageServiceDefaults(diagnosticDefault)

// --- Registration to monaco editor ---

monaco.languages.register({
  id: languageId,
  extensions: ['.yaml', '.yml'],
  aliases: ['YAML', 'yaml', 'YML', 'yml'],
  mimetypes: ['application/x-yaml']
})

monaco.languages.setLanguageConfiguration(languageId, {
  comments: {
    lineComment: '#'
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')']
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],

  onEnterRules: [
    {
      beforeText: /:\s*$/,
      action: { indentAction: monaco.languages.IndentAction.Indent }
    }
  ]
})

const worker = createWorkerManager<YAMLWorker, CreateData>(monaco, {
  label: 'yaml',
  moduleId: 'monaco-yaml/yaml.worker',
  createData: {
    languageSettings: yamlDefaults.diagnosticsOptions,
    enableSchemaRequest: yamlDefaults.diagnosticsOptions.enableSchemaRequest
  }
})

monaco.languages.registerCompletionItemProvider(
  languageId,
  createCompletionItemProvider(worker.getWorker)
)
monaco.languages.registerHoverProvider(languageId, createHoverProvider(worker.getWorker))
monaco.languages.registerDefinitionProvider(languageId, createDefinitionProvider(worker.getWorker))
monaco.languages.registerDocumentSymbolProvider(
  languageId,
  createDocumentSymbolProvider(worker.getWorker)
)
monaco.languages.registerDocumentFormattingEditProvider(
  languageId,
  createDocumentFormattingEditProvider(worker.getWorker)
)
monaco.languages.registerLinkProvider(languageId, createLinkProvider(worker.getWorker))
monaco.languages.registerCodeActionProvider(languageId, createCodeActionProvider(worker.getWorker))

let markerDataProvider = registerMarkerDataProvider(
  monaco,
  languageId,
  createMarkerDataProvider(worker.getWorker)
)

yamlDefaults.onDidChange(() => {
  worker.updateCreateData({
    languageSettings: yamlDefaults.diagnosticsOptions,
    enableSchemaRequest: yamlDefaults.diagnosticsOptions.enableSchemaRequest
  })
  markerDataProvider.dispose()
  markerDataProvider = registerMarkerDataProvider(
    monaco,
    languageId,
    createMarkerDataProvider(worker.getWorker)
  )
})

/**
 * Configure `monaco-yaml` diagnostics options.
 *
 * @param options The options to set.
 */
export function setDiagnosticsOptions(options: DiagnosticsOptions = {}): void {
  yamlDefaults.setDiagnosticsOptions(options)
}
