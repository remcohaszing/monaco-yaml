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
if (typeof fetch !== 'undefined'){
	defaultSchemaRequestService = function (url) { return fetch(url).then(response => response.text())};
}

class PromiseAdapter<T> implements yamlService.Thenable<T> {
	private wrapped: monaco.Promise<T>;

	constructor(executor: (resolve: (value?: T | yamlService.Thenable<T>) => void, reject: (reason?: any) => void) => void) {
		this.wrapped = new monaco.Promise<T>(executor);
	}
	public then<TResult>(onfulfilled?: (value: T) => TResult | yamlService.Thenable<TResult>, onrejected?: (reason: any) => void): yamlService.Thenable<TResult> {
		let thenable: yamlService.Thenable<T> = this.wrapped;
		return thenable.then(onfulfilled, onrejected);
	}
	public getWrapped(): monaco.Thenable<T> {
		return this.wrapped;
	}
	public static resolve<T>(v: T | Thenable<T>): yamlService.Thenable<T> {
		return <monaco.Thenable<T>>monaco.Promise.as(v);
	}
	public static reject<T>(v: T): yamlService.Thenable<T> {
		return monaco.Promise.wrapError(<any>v);
	}
	public static all<T>(values: yamlService.Thenable<T>[]): yamlService.Thenable<T[]> {
		return monaco.Promise.join(values);
	}
}

export class YAMLWorker {

	private _ctx: IWorkerContext;
	private _languageService: yamlService.LanguageService;
	private _languageSettings: yamlService.LanguageSettings;
	private _languageId: string;

	constructor(ctx: IWorkerContext, createData: ICreateData) {
		this._ctx = ctx;
		this._languageSettings = createData.languageSettings;
		this._languageId = createData.languageId;
		this._languageService = yamlService.getLanguageService(createData.enableSchemaRequest && defaultSchemaRequestService,
			null, [], PromiseAdapter,
		);
		this._languageService.configure({ ...this._languageSettings, hover: true, isKubernetes: true });
	}

	doValidation(uri: string): Thenable<ls.Diagnostic[]> {
		let document = this._getTextDocument(uri);
		if (document) {
			let yamlDocument = this._languageService.parseYAMLDocument(document);
			return this._languageService.doValidation(document, yamlDocument);
		}
		return Promise.as([]);
	}
	doComplete(uri: string, position: ls.Position): Thenable<ls.CompletionList> {
		let document = this._getTextDocument(uri);
		let yamlDocument = this._languageService.parseYAMLDocument(document);
		return this._languageService.doComplete(document, position, yamlDocument);
	}
	doResolve(item: ls.CompletionItem): Thenable<ls.CompletionItem> {
		return this._languageService.doResolve(item);
	}
	doHover(uri: string, position: ls.Position): Thenable<ls.Hover> {
		let document = this._getTextDocument(uri);
		let yamlDocument = this._languageService.parseYAMLDocument(document);
		return this._languageService.doHover(document, position, yamlDocument);
	}
	format(uri: string, range: ls.Range, options: ls.FormattingOptions): Thenable<ls.TextEdit[]> {
		let document = this._getTextDocument(uri);
		let textEdits = this._languageService.doFormat(document, options, []);
		return Promise.as(textEdits);
	}
	resetSchema(uri: string): Thenable<boolean> {
		return Promise.as(this._languageService.resetSchema(uri));
	}
	findDocumentSymbols(uri: string): Thenable<ls.SymbolInformation[]> {
		let document = this._getTextDocument(uri);
		let yamlDocument = this._languageService.parseYAMLDocument(document);
		let symbols = this._languageService.findDocumentSymbols(document, yamlDocument);
		return Promise.as(symbols);
	}
	private _getTextDocument(uri: string): ls.TextDocument {
		let models = this._ctx.getMirrorModels();
		for (let model of models) {
			if (model.uri.toString() === uri) {
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
}

export function create(ctx: IWorkerContext, createData: ICreateData): YAMLWorker {
	return new YAMLWorker(ctx, createData);
}