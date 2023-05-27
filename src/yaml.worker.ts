import { initialize } from 'monaco-worker-manager/worker';
import { TextDocument } from 'vscode-languageserver-textdocument';
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
  type TextEdit,
} from 'vscode-languageserver-types';
import { type Telemetry } from 'yaml-language-server/lib/esm/languageservice/telemetry.js';
import {
  type CustomFormatterOptions,
  getLanguageService,
  type LanguageSettings,
  type WorkspaceContextService,
} from 'yaml-language-server/lib/esm/languageservice/yamlLanguageService.js';

import { languageId } from './constants.js';

async function schemaRequestService(uri: string): Promise<string> {
  const response = await fetch(uri);
  if (response.ok) {
    return response.text();
  }
  throw new Error(`Schema request failed for ${uri}`);
}

export interface CreateData {
  languageSettings: LanguageSettings;
  enableSchemaRequest?: boolean;
}

export interface YAMLWorker {
  doValidation: (uri: string) => Diagnostic[] | undefined;

  doComplete: (uri: string, position: Position) => CompletionList | undefined;

  doDefinition: (uri: string, position: Position) => LocationLink[] | undefined;

  doHover: (uri: string, position: Position) => Hover | null | undefined;

  format: (uri: string, options: CustomFormatterOptions) => TextEdit[] | undefined;

  resetSchema: (uri: string) => boolean | undefined;

  findDocumentSymbols: (uri: string) => DocumentSymbol[] | undefined;

  findLinks: (uri: string) => DocumentLink[] | undefined;

  getCodeAction: (uri: string, range: Range, diagnostics: Diagnostic[]) => CodeAction[] | undefined;
}

const telemetry: Telemetry = {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  send() {},
  sendError(name, properties) {
    // eslint-disable-next-line no-console
    console.error('monaco-yaml', name, properties);
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  sendTrack() {},
};

const workspaceContext: WorkspaceContextService = {
  resolveRelativePath(relativePath, resource) {
    return String(new URL(relativePath, resource));
  },
};

initialize<YAMLWorker, CreateData>((ctx, { enableSchemaRequest, languageSettings }) => {
  const languageService = getLanguageService({
    // @ts-expect-error Type definitions are wrong. This may be null.
    schemaRequestService: enableSchemaRequest ? schemaRequestService : null,
    telemetry,
    workspaceContext,
  });
  languageService.configure(languageSettings);

  const getTextDocument = (uri: string): TextDocument | undefined => {
    const models = ctx.getMirrorModels();
    for (const model of models) {
      if (String(model.uri) === uri) {
        return TextDocument.create(uri, languageId, model.version, model.getValue());
      }
    }
  };

  return {
    doValidation(uri) {
      const document = getTextDocument(uri);
      if (document) {
        return languageService.doValidation(document, Boolean(languageSettings.isKubernetes));
      }
    },

    doComplete(uri, position) {
      const document = getTextDocument(uri);
      if (document) {
        return languageService.doComplete(
          document,
          position,
          Boolean(languageSettings.isKubernetes),
        );
      }
    },

    doDefinition(uri, position) {
      const document = getTextDocument(uri);
      if (document) {
        return languageService.doDefinition(document, { position, textDocument: { uri } });
      }
    },

    doHover(uri, position) {
      const document = getTextDocument(uri);
      if (document) {
        return languageService.doHover(document, position);
      }
    },

    format(uri, options) {
      const document = getTextDocument(uri);
      if (document) {
        return languageService.doFormat(document, options);
      }
    },

    resetSchema(uri) {
      return languageService.resetSchema(uri);
    },

    findDocumentSymbols(uri) {
      const document = getTextDocument(uri);
      if (document) {
        return languageService.findDocumentSymbols2(document, {});
      }
    },

    findLinks(uri) {
      const document = getTextDocument(uri);
      if (document) {
        return languageService.findLinks(document);
      }
    },

    getCodeAction(uri, range, diagnostics) {
      const document = getTextDocument(uri);
      if (document) {
        return languageService.getCodeAction(document, {
          range,
          textDocument: { uri },
          context: { diagnostics },
        });
      }
    },
  };
});
