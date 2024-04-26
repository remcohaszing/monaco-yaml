import {
  fromCodeActionContext,
  fromPosition,
  fromRange,
  toCodeAction,
  toCompletionList,
  toDocumentSymbol,
  toFoldingRange,
  toHover,
  toLink,
  toLocationLink,
  toMarkerData,
  toTextEdit
} from 'monaco-languageserver-types'
import { registerMarkerDataProvider } from 'monaco-marker-data-provider'
import { type MonacoEditor } from 'monaco-types'
import { createWorkerManager } from 'monaco-worker-manager'
import { type MonacoYaml, type MonacoYamlOptions } from 'monaco-yaml'

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

  monaco.languages.register({
    id: 'yaml',
    extensions: ['.yaml', '.yml'],
    aliases: ['YAML', 'yaml', 'YML', 'yml'],
    mimetypes: ['application/x-yaml']
  })

  const workerManager = createWorkerManager<YAMLWorker, MonacoYamlOptions>(monaco, {
    label: 'yaml',
    moduleId: 'monaco-yaml/yaml.worker',
    createData
  })

  const markerDataProvider = registerMarkerDataProvider(monaco, 'yaml', {
    owner: 'yaml',

    async provideMarkerData(model) {
      const worker = await workerManager.getWorker(model.uri)
      const diagnostics = await worker.doValidation(String(model.uri))

      return diagnostics?.map((diagnostic) => toMarkerData(diagnostic))
    },

    async doReset(model) {
      const worker = await workerManager.getWorker(model.uri)
      await worker.resetSchema(String(model.uri))
    }
  })

  const disposables = [
    workerManager,
    markerDataProvider,

    monaco.languages.registerCompletionItemProvider('yaml', {
      triggerCharacters: [' ', ':'],

      async provideCompletionItems(model, position) {
        const wordInfo = model.getWordUntilPosition(position)
        const worker = await workerManager.getWorker(model.uri)
        const info = await worker.doComplete(String(model.uri), fromPosition(position))

        if (info) {
          return toCompletionList(info, {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: wordInfo.startColumn,
              endLineNumber: position.lineNumber,
              endColumn: wordInfo.endColumn
            }
          })
        }
      }
    }),

    monaco.languages.registerHoverProvider('yaml', {
      async provideHover(model, position) {
        const worker = await workerManager.getWorker(model.uri)
        const info = await worker.doHover(String(model.uri), fromPosition(position))

        if (info) {
          return toHover(info)
        }
      }
    }),

    monaco.languages.registerDefinitionProvider('yaml', {
      async provideDefinition(model, position) {
        const worker = await workerManager.getWorker(model.uri)
        const locationLinks = await worker.doDefinition(String(model.uri), fromPosition(position))

        return locationLinks?.map(toLocationLink)
      }
    }),

    monaco.languages.registerDocumentSymbolProvider('yaml', {
      displayName: 'yaml',

      async provideDocumentSymbols(model) {
        const worker = await workerManager.getWorker(model.uri)
        const items = await worker.findDocumentSymbols(String(model.uri))

        return items?.map(toDocumentSymbol)
      }
    }),

    monaco.languages.registerDocumentFormattingEditProvider('yaml', {
      displayName: 'yaml',

      async provideDocumentFormattingEdits(model) {
        const worker = await workerManager.getWorker(model.uri)
        const edits = await worker.format(String(model.uri))

        return edits?.map(toTextEdit)
      }
    }),

    monaco.languages.registerLinkProvider('yaml', {
      async provideLinks(model) {
        const worker = await workerManager.getWorker(model.uri)
        const links = await worker.findLinks(String(model.uri))

        if (links) {
          return {
            links: links.map(toLink)
          }
        }
      }
    }),

    monaco.languages.registerCodeActionProvider('yaml', {
      async provideCodeActions(model, range, context) {
        const worker = await workerManager.getWorker(model.uri)
        const codeActions = await worker.getCodeAction(
          String(model.uri),
          fromRange(range),
          fromCodeActionContext(context)
        )

        if (codeActions) {
          return {
            actions: codeActions.map((codeAction) => toCodeAction(codeAction)),
            dispose() {
              // This is required by the TypeScript interface, but it’s not implemented.
            }
          }
        }
      }
    }),

    monaco.languages.registerFoldingRangeProvider('yaml', {
      async provideFoldingRanges(model) {
        const worker = await workerManager.getWorker(model.uri)
        const foldingRanges = await worker.getFoldingRanges(String(model.uri))

        return foldingRanges?.map(toFoldingRange)
      }
    }),

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

    async update(newOptions) {
      workerManager.updateCreateData(Object.assign(createData, newOptions))
      await markerDataProvider.revalidate()
    }
  }
}
