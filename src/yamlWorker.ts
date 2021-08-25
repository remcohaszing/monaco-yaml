import { worker } from 'monaco-editor/esm/vs/editor/editor.api';
import { Promisable } from 'type-fest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as ls from 'vscode-languageserver-types';
import {
  CustomFormatterOptions,
  getLanguageService,
  LanguageSettings,
} from 'yaml-language-server/lib/esm/languageservice/yamlLanguageService';

let defaultSchemaRequestService: (url: string) => Promise<string>;

if (typeof fetch !== 'undefined') {
  defaultSchemaRequestService = (url) => fetch(url).then((response) => response.text());
}

export interface YAMLWorker {
  doValidation: (uri: string) => Promisable<ls.Diagnostic[]>;

  doComplete: (uri: string, position: ls.Position) => Promisable<ls.CompletionList>;

  doHover: (uri: string, position: ls.Position) => Promisable<ls.Hover>;

  format: (uri: string, options: CustomFormatterOptions) => Promisable<ls.TextEdit[]>;

  resetSchema: (uri: string) => Promisable<boolean>;

  findDocumentSymbols: (uri: string) => Promisable<ls.DocumentSymbol[]>;

  findLinks: (uri: string) => Promisable<ls.DocumentLink[]>;
}

export function createYAMLWorker(
  ctx: worker.IWorkerContext,
  {
    enableSchemaRequest,
    isKubernetes = false,
    languageId,
    languageSettings,
    prefix = '',
  }: ICreateData,
): YAMLWorker {
  const service = (url: string): Promise<string> => defaultSchemaRequestService(`${prefix}${url}`);
  const languageService = getLanguageService(enableSchemaRequest && service, null, null, null);
  languageService.configure({
    ...languageSettings,
    hover: true,
    isKubernetes,
  });

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
        return languageService.doValidation(document, isKubernetes);
      }
      return [];
    },

    doComplete(uri, position) {
      const document = getTextDocument(uri);
      return languageService.doComplete(document, position, isKubernetes);
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
  languageId: string;
  languageSettings: LanguageSettings;
  enableSchemaRequest: boolean;
  prefix?: string;
  isKubernetes?: boolean;
}
