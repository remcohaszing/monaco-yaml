import { initialize } from 'monaco-worker-manager/worker';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  CodeAction,
  CompletionList,
  Diagnostic,
  DocumentLink,
  DocumentSymbol,
  Hover,
  LocationLink,
  Position,
  Range,
  TextEdit,
} from 'vscode-languageserver-types';
import {
  CustomFormatterOptions,
  getLanguageService,
  LanguageSettings,
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
  enableSchemaRequest: boolean;
}

export interface YAMLWorker {
  doValidation: (uri: string) => Diagnostic[];

  doComplete: (uri: string, position: Position) => CompletionList;

  doDefinition: (uri: string, position: Position) => LocationLink[];

  doHover: (uri: string, position: Position) => Hover;

  format: (uri: string, options: CustomFormatterOptions) => TextEdit[];

  resetSchema: (uri: string) => boolean;

  findDocumentSymbols: (uri: string) => DocumentSymbol[];

  findLinks: (uri: string) => DocumentLink[];

  getCodeAction: (uri: string, range: Range, diagnostics: Diagnostic[]) => CodeAction[];
}

initialize<YAMLWorker, CreateData>((ctx, { enableSchemaRequest, languageSettings }) => {
  const languageService = getLanguageService(
    enableSchemaRequest ? schemaRequestService : null,
    null,
    null,
    null,
    null,
  );
  languageService.configure(languageSettings);

  const getTextDocument = (uri: string): TextDocument => {
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
        return languageService.doValidation(document, languageSettings.isKubernetes);
      }
      return [];
    },

    doComplete(uri, position) {
      const document = getTextDocument(uri);
      return languageService.doComplete(document, position, languageSettings.isKubernetes);
    },

    doDefinition(uri, position) {
      const document = getTextDocument(uri);
      return languageService.doDefinition(document, { position, textDocument: { uri } });
    },

    doHover(uri, position) {
      const document = getTextDocument(uri);
      return languageService.doHover(document, position);
    },

    format(uri, options) {
      const document = getTextDocument(uri);
      return languageService.doFormat(document, options);
    },

    resetSchema(uri) {
      return languageService.resetSchema(uri);
    },

    findDocumentSymbols(uri) {
      const document = getTextDocument(uri);
      return languageService.findDocumentSymbols2(document, {});
    },

    findLinks(uri) {
      const document = getTextDocument(uri);
      return languageService.findLinks(document);
    },

    getCodeAction(uri, range, diagnostics) {
      const document = getTextDocument(uri);
      return languageService.getCodeAction(document, {
        range,
        textDocument: { uri },
        context: { diagnostics },
      });
    },
  };
});
