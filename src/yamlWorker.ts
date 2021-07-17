import { worker } from 'monaco-editor/esm/vs/editor/editor.api';
import * as ls from 'vscode-languageserver-types';
import * as yamlService from 'yaml-language-server';

let defaultSchemaRequestService: (url: string) => PromiseLike<string>;

if (typeof fetch !== 'undefined') {
  defaultSchemaRequestService = (url) => fetch(url).then((response) => response.text());
}

export class YAMLWorker {
  private _ctx: worker.IWorkerContext;
  private _languageService: yamlService.LanguageService;
  private _languageSettings: yamlService.LanguageSettings;
  private _languageId: string;
  private _isKubernetes: boolean;

  constructor(ctx: worker.IWorkerContext, createData: ICreateData) {
    const prefix = createData.prefix || '';
    const service = (url: string): PromiseLike<string> =>
      defaultSchemaRequestService(`${prefix}${url}`);
    this._ctx = ctx;
    this._languageSettings = createData.languageSettings;
    this._languageId = createData.languageId;
    this._languageService = yamlService.getLanguageService(
      createData.enableSchemaRequest && service,
      null,
      [],
    );
    this._isKubernetes = createData.isKubernetes || false;
    this._languageService.configure({
      ...this._languageSettings,
      hover: true,
      isKubernetes: this._isKubernetes,
    });
  }

  doValidation(uri: string): PromiseLike<ls.Diagnostic[]> {
    const document = this._getTextDocument(uri);
    if (document) {
      return this._languageService.doValidation(document, this._isKubernetes);
    }
    return Promise.resolve([]);
  }

  doComplete(uri: string, position: ls.Position): PromiseLike<ls.CompletionList> {
    const document = this._getTextDocument(uri);
    return this._languageService.doComplete(document, position, this._isKubernetes);
  }

  doResolve(item: ls.CompletionItem): PromiseLike<ls.CompletionItem> {
    return this._languageService.doResolve(item);
  }

  doHover(uri: string, position: ls.Position): PromiseLike<ls.Hover> {
    const document = this._getTextDocument(uri);
    return this._languageService.doHover(document, position);
  }

  format(
    uri: string,
    range: ls.Range,
    options: yamlService.CustomFormatterOptions,
  ): PromiseLike<ls.TextEdit[]> {
    const document = this._getTextDocument(uri);
    const textEdits = this._languageService.doFormat(document, options);
    return Promise.resolve(textEdits);
  }

  resetSchema(uri: string): PromiseLike<boolean> {
    return Promise.resolve(this._languageService.resetSchema(uri));
  }

  findDocumentSymbols(uri: string): PromiseLike<ls.DocumentSymbol[]> {
    const document = this._getTextDocument(uri);
    const symbols = this._languageService.findDocumentSymbols2(document);
    return Promise.resolve(symbols);
  }

  private _getTextDocument(uri: string): ls.TextDocument {
    const models = this._ctx.getMirrorModels();
    for (const model of models) {
      if (String(model.uri) === uri) {
        return ls.TextDocument.create(uri, this._languageId, model.version, model.getValue());
      }
    }
    return null;
  }
}

export interface ICreateData {
  languageId: string;
  languageSettings: yamlService.LanguageSettings;
  enableSchemaRequest: boolean;
  prefix?: string;
  isKubernetes?: boolean;
}

export function create(ctx: worker.IWorkerContext, createData: ICreateData): YAMLWorker {
  return new YAMLWorker(ctx, createData);
}
