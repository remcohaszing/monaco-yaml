import { worker } from 'monaco-editor/esm/vs/editor/editor.api';
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
  doValidation: (uri: string) => PromiseLike<ls.Diagnostic[]>;

  doComplete: (uri: string, position: ls.Position) => PromiseLike<ls.CompletionList>;

  doHover: (uri: string, position: ls.Position) => PromiseLike<ls.Hover>;

  format: (uri: string, options: CustomFormatterOptions) => PromiseLike<ls.TextEdit[]>;

  resetSchema: (uri: string) => PromiseLike<boolean>;

  findDocumentSymbols: (uri: string) => PromiseLike<ls.DocumentSymbol[]>;

  findLinks: (uri: string) => PromiseLike<ls.DocumentLink[]>;
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
      return Promise.resolve([]);
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
      const textEdits = languageService.doFormat(document, options);
      return Promise.resolve(textEdits);
    },

    resetSchema(uri) {
      return Promise.resolve(languageService.resetSchema(uri));
    },

    findDocumentSymbols(uri) {
      const document = getTextDocument(uri);
      const symbols = languageService.findDocumentSymbols2(document, {});
      return Promise.resolve(symbols);
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
