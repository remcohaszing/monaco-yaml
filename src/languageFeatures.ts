import { type languages } from 'monaco-editor/esm/vs/editor/editor.api.js'
import {
  fromMarkerData,
  fromPosition,
  fromRange,
  toCodeAction,
  toCompletionList,
  toDocumentSymbol,
  toHover,
  toLink,
  toLocationLink,
  toMarkerData,
  toTextEdit
} from 'monaco-languageserver-types'
import { type MarkerDataProvider } from 'monaco-marker-data-provider'
import { type WorkerGetter } from 'monaco-worker-manager'

import { type YAMLWorker } from './yaml.worker.js'

export type WorkerAccessor = WorkerGetter<YAMLWorker>

export function createMarkerDataProvider(getWorker: WorkerAccessor): MarkerDataProvider {
  return {
    owner: 'yaml',
    async provideMarkerData(model) {
      const worker = await getWorker(model.uri)
      const diagnostics = await worker.doValidation(String(model.uri))

      return diagnostics?.map((diagnostic) => toMarkerData(diagnostic))
    },

    async doReset(model) {
      const worker = await getWorker(model.uri)
      await worker.resetSchema(String(model.uri))
    }
  }
}

export function createCompletionItemProvider(
  getWorker: WorkerAccessor
): languages.CompletionItemProvider {
  return {
    triggerCharacters: [' ', ':'],

    async provideCompletionItems(model, position) {
      const resource = model.uri

      const worker = await getWorker(resource)
      const info = await worker.doComplete(String(resource), fromPosition(position))
      if (!info) {
        return
      }

      const wordInfo = model.getWordUntilPosition(position)

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
}

export function createDefinitionProvider(getWorker: WorkerAccessor): languages.DefinitionProvider {
  return {
    async provideDefinition(model, position) {
      const resource = model.uri

      const worker = await getWorker(resource)
      const locationLinks = await worker.doDefinition(String(resource), fromPosition(position))

      return locationLinks?.map(toLocationLink)
    }
  }
}

export function createHoverProvider(getWorker: WorkerAccessor): languages.HoverProvider {
  return {
    async provideHover(model, position) {
      const resource = model.uri

      const worker = await getWorker(resource)
      const info = await worker.doHover(String(resource), fromPosition(position))
      if (!info) {
        return
      }

      return toHover(info)
    }
  }
}

export function createDocumentSymbolProvider(
  getWorker: WorkerAccessor
): languages.DocumentSymbolProvider {
  return {
    async provideDocumentSymbols(model) {
      const resource = model.uri

      const worker = await getWorker(resource)
      const items = await worker.findDocumentSymbols(String(resource))

      return items?.map(toDocumentSymbol)
    }
  }
}

export function createDocumentFormattingEditProvider(
  getWorker: WorkerAccessor
): languages.DocumentFormattingEditProvider {
  return {
    async provideDocumentFormattingEdits(model) {
      const resource = model.uri

      const worker = await getWorker(resource)
      const edits = await worker.format(String(resource), {})

      return edits?.map(toTextEdit)
    }
  }
}

export function createLinkProvider(getWorker: WorkerAccessor): languages.LinkProvider {
  return {
    async provideLinks(model) {
      const resource = model.uri

      const worker = await getWorker(resource)
      const links = await worker.findLinks(String(resource))

      if (!links) {
        return
      }

      return {
        links: links.map(toLink)
      }
    }
  }
}

export function createCodeActionProvider(getWorker: WorkerAccessor): languages.CodeActionProvider {
  return {
    async provideCodeActions(model, range, context) {
      const resource = model.uri

      const worker = await getWorker(resource)
      const codeActions = await worker.getCodeAction(
        String(resource),
        fromRange(range),
        context.markers.map(fromMarkerData)
      )

      if (!codeActions) {
        return
      }

      return {
        actions: codeActions.map((codeAction) => toCodeAction(codeAction)),
        dispose() {
          // This is required by the TypeScript interface, but it’s not implemented.
        }
      }
    }
  }
}
