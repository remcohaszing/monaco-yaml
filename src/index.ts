import { setMonaco } from 'monaco-languageserver-types'
import { registerMarkerDataProvider } from 'monaco-marker-data-provider'
import { type MonacoEditor } from 'monaco-types'
import { createWorkerManager } from 'monaco-worker-manager'
import { type MonacoYaml, type MonacoYamlOptions } from 'monaco-yaml'

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
import { type YAMLWorker } from './yaml.worker.js'

export function configureMonacoYaml(monaco: MonacoEditor, options: MonacoYamlOptions): MonacoYaml {
  const createData: MonacoYamlOptions = {
    completion: true,
    customTags: [],
    enableSchemaRequest: false,
    format: true,
    isKubernetes: false,
    hover: true,
    schemas: [],
    validate: true,
    yamlVersion: '1.2',
    ...options
  }

  setMonaco(monaco)

  monaco.languages.register({
    id: 'yaml',
    extensions: ['.yaml', '.yml'],
    aliases: ['YAML', 'yaml', 'YML', 'yml'],
    mimetypes: ['application/x-yaml']
  })

  const worker = createWorkerManager<YAMLWorker, MonacoYamlOptions>(monaco, {
    label: 'yaml',
    moduleId: 'monaco-yaml/yaml.worker',
    createData
  })

  let markerDataProvider = registerMarkerDataProvider(
    monaco,
    'yaml',
    createMarkerDataProvider(worker.getWorker)
  )
  const disposables = [
    worker,

    monaco.languages.registerCompletionItemProvider(
      'yaml',
      createCompletionItemProvider(worker.getWorker)
    ),

    monaco.languages.registerHoverProvider('yaml', createHoverProvider(worker.getWorker)),

    monaco.languages.registerDefinitionProvider('yaml', createDefinitionProvider(worker.getWorker)),

    monaco.languages.registerDocumentSymbolProvider(
      'yaml',
      createDocumentSymbolProvider(worker.getWorker)
    ),

    monaco.languages.registerDocumentFormattingEditProvider(
      'yaml',
      createDocumentFormattingEditProvider(worker.getWorker)
    ),

    monaco.languages.registerLinkProvider('yaml', createLinkProvider(worker.getWorker)),

    monaco.languages.registerCodeActionProvider('yaml', createCodeActionProvider(worker.getWorker)),

    monaco.languages.setLanguageConfiguration('yaml', {
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
  ]

  return {
    dispose() {
      for (const disposable of disposables) {
        disposable.dispose()
      }
    },

    update(newOptions) {
      worker.updateCreateData(Object.assign(createData, newOptions))
      markerDataProvider.dispose()
      markerDataProvider = registerMarkerDataProvider(
        monaco,
        'yaml',
        createMarkerDataProvider(worker.getWorker)
      )
    }
  }
}
