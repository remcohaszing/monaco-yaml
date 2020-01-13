/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Adam Voss. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import Promise = monaco.Promise;
import Thenable = monaco.Thenable;
import IWorkerContext = monaco.worker.IWorkerContext;

import * as ls from 'vscode-languageserver-types';
import * as yamlService from './languageservice/yamlLanguageService';

let defaultSchemaRequestService;
if (typeof fetch !== 'undefined') {
  defaultSchemaRequestService = function(url) {
    return fetch(url).then(response => response.text());
  };
}

export class YAMLWorker {
  private _ctx: IWorkerContext;
  private _languageService: yamlService.LanguageService;
  private _languageSettings: yamlService.LanguageSettings;
  private _languageId: string;
  private _isKubernetes: boolean;

  constructor(ctx: IWorkerContext, createData: ICreateData) {
    const prefix = createData.prefix || '';
    const service = (url: string) =>
      defaultSchemaRequestService(`${prefix}${url}`);
    this._ctx = ctx;
    this._languageSettings = createData.languageSettings;
    this._languageId = createData.languageId;
    this._languageService = yamlService.getLanguageService(
      createData.enableSchemaRequest && service,
      null,
      []
    );
    this._isKubernetes = createData.isKubernetes || false;
    this._languageService.configure({
      ...this._languageSettings,
      hover: true,
      isKubernetes: this._isKubernetes,
    });
  }

  public doValidation(uri: string): Thenable<ls.Diagnostic[]> {
    const document = this._getTextDocument(uri);
    if (document) {
      return this._languageService.doValidation(document, this._isKubernetes);
    }
    return Promise.as([]);
  }

  public doComplete(
    uri: string,
    position: ls.Position
  ): Thenable<ls.CompletionList> {
    const document = this._getTextDocument(uri);
    return this._languageService.doComplete(
      document,
      position,
      this._isKubernetes
    );
  }

  public doResolve(item: ls.CompletionItem): Thenable<ls.CompletionItem> {
    return this._languageService.doResolve(item);
  }

  public doHover(uri: string, position: ls.Position): Thenable<ls.Hover> {
    const document = this._getTextDocument(uri);
    return this._languageService.doHover(document, position);
  }

  public format(
    uri: string,
    range: ls.Range,
    options: yamlService.CustomFormatterOptions
  ): Thenable<ls.TextEdit[]> {
    const document = this._getTextDocument(uri);
    const textEdits = this._languageService.doFormat(document, options);
    return Promise.as(textEdits);
  }

  public resetSchema(uri: string): Thenable<boolean> {
    return Promise.as(this._languageService.resetSchema(uri));
  }

  public findDocumentSymbols(uri: string): Thenable<ls.DocumentSymbol[]> {
    const document = this._getTextDocument(uri);
    const symbols = this._languageService.findDocumentSymbols2(document);
    return Promise.as(symbols);
  }

  private _getTextDocument(uri: string): ls.TextDocument {
    const models = this._ctx.getMirrorModels();
    for (const model of models) {
      if (model.uri.toString() === uri) {
        return ls.TextDocument.create(
          uri,
          this._languageId,
          model.version,
          model.getValue()
        );
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

export function create(
  ctx: IWorkerContext,
  createData: ICreateData
): YAMLWorker {
  return new YAMLWorker(ctx, createData);
}
