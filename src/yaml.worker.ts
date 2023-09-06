import { initialize } from 'monaco-worker-manager/worker'
import { type MonacoYamlOptions } from 'monaco-yaml'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  type CodeAction,
  type CompletionList,
  type Diagnostic,
  type DocumentLink,
  type DocumentSymbol,
  type Hover,
  type LocationLink,
  type Position,
  type Range,
  type TextEdit
} from 'vscode-languageserver-types'
import { type Telemetry } from 'yaml-language-server/lib/esm/languageservice/telemetry.js'
import {
  getLanguageService,
  type WorkspaceContextService
} from 'yaml-language-server/lib/esm/languageservice/yamlLanguageService.js'

async function schemaRequestService(uri: string): Promise<string> {
  const response = await fetch(uri)
  if (response.ok) {
    return response.text()
  }
  throw new Error(`Schema request failed for ${uri}`)
}

export interface YAMLWorker {
  doValidation: (uri: string) => Diagnostic[] | undefined

  doComplete: (uri: string, position: Position) => CompletionList | undefined

  doDefinition: (uri: string, position: Position) => LocationLink[] | undefined

  doHover: (uri: string, position: Position) => Hover | null | undefined

  format: (uri: string) => TextEdit[] | undefined

  resetSchema: (uri: string) => boolean | undefined

  findDocumentSymbols: (uri: string) => DocumentSymbol[] | undefined

  findLinks: (uri: string) => DocumentLink[] | undefined

  getCodeAction: (uri: string, range: Range, diagnostics: Diagnostic[]) => CodeAction[] | undefined
}

const telemetry: Telemetry = {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  send() {},
  sendError(name, properties) {
    // eslint-disable-next-line no-console
    console.error('monaco-yaml', name, properties)
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  sendTrack() {}
}

const workspaceContext: WorkspaceContextService = {
  resolveRelativePath(relativePath, resource) {
    return String(new URL(relativePath, resource))
  }
}

initialize<YAMLWorker, MonacoYamlOptions>((ctx, { enableSchemaRequest, ...languageSettings }) => {
  const ls = getLanguageService({
    // @ts-expect-error Type definitions are wrong. This may be null.
    schemaRequestService: enableSchemaRequest ? schemaRequestService : null,
    telemetry,
    workspaceContext
  })

  const getTextDocument = (uri: string): TextDocument | undefined => {
    const models = ctx.getMirrorModels()
    for (const model of models) {
      if (String(model.uri) === uri) {
        return TextDocument.create(uri, 'yaml', model.version, model.getValue())
      }
    }
  }

  ls.configure(languageSettings)

  return {
    doValidation(uri) {
      const document = getTextDocument(uri)
      if (document) {
        return ls.doValidation(document, Boolean(languageSettings.isKubernetes))
      }
    },

    doComplete(uri, position) {
      const document = getTextDocument(uri)
      if (document) {
        return ls.doComplete(document, position, Boolean(languageSettings.isKubernetes))
      }
    },

    doDefinition(uri, position) {
      const document = getTextDocument(uri)
      if (document) {
        return ls.doDefinition(document, { position, textDocument: { uri } })
      }
    },

    doHover(uri, position) {
      const document = getTextDocument(uri)
      if (document) {
        return ls.doHover(document, position)
      }
    },

    format(uri) {
      const document = getTextDocument(uri)
      if (document) {
        return ls.doFormat(document, {})
      }
    },

    resetSchema(uri) {
      return ls.resetSchema(uri)
    },

    findDocumentSymbols(uri) {
      const document = getTextDocument(uri)
      if (document) {
        return ls.findDocumentSymbols2(document, {})
      }
    },

    findLinks(uri) {
      const document = getTextDocument(uri)
      if (document) {
        return ls.findLinks(document)
      }
    },

    getCodeAction(uri, range, diagnostics) {
      const document = getTextDocument(uri)
      if (document) {
        return ls.getCodeAction(document, {
          range,
          textDocument: { uri },
          context: { diagnostics }
        })
      }
    }
  }
})
