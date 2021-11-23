import { worker } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { Promisable } from 'type-fest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as ls from 'vscode-languageserver-types';
import {
  CustomFormatterOptions,
  getLanguageService,
  LanguageSettings,
} from 'yaml-language-server/lib/esm/languageservice/yamlLanguageService.js';

import { languageId } from './constants';

async function schemaRequestService(uri: string): Promise<string> {
  const response = await fetch(uri);
  if (response.ok) {
    return response.text();
  }
  throw new Error(`Schema request failed for ${uri}`);
}

export interface YAMLWorker {
  doValidation: (uri: string) => Promisable<ls.Diagnostic[]>;

  doComplete: (uri: string, position: ls.Position) => Promisable<ls.CompletionList>;

  doDefinition: (uri: string, position: ls.Position) => Promisable<ls.LocationLink[]>;

  doHover: (uri: string, position: ls.Position) => Promisable<ls.Hover>;

  format: (uri: string, options: CustomFormatterOptions) => Promisable<ls.TextEdit[]>;

  resetSchema: (uri: string) => Promisable<boolean>;

  findDocumentSymbols: (uri: string) => Promisable<ls.DocumentSymbol[]>;

  findLinks: (uri: string) => Promisable<ls.DocumentLink[]>;
}

export function createYAMLWorker(
  ctx: worker.IWorkerContext,
  { enableSchemaRequest, languageSettings }: ICreateData,
): YAMLWorker {
  const languageService = getLanguageService(
    enableSchemaRequest ? schemaRequestService : null,
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
    return null;
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
      return Promise.resolve(languageService.findLinks(document));
    },
  };
}

export interface ICreateData {
  languageSettings: LanguageSettings;
  enableSchemaRequest: boolean;
  isKubernetes?: boolean;
}
