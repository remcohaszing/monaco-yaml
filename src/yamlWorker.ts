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
import { SchemaRequestService } from './languageservice/yamlLanguageService';

class PromiseAdapter<T> implements yamlService.Thenable<T> {
	private wrapped: monaco.Promise<T>;

	constructor(executor: (resolve: (value?: T | yamlService.Thenable<T>) => void, reject: (reason?: any) => void) => void) {
		this.wrapped = new monaco.Promise<T>(executor);
	}
	public then<TResult>(onfulfilled?: (value: T) => TResult | yamlService.Thenable<TResult>, onrejected?: (reason: any) => void): yamlService.Thenable<TResult> {
		let thenable : yamlService.Thenable<T> = this.wrapped;
		return thenable.then(onfulfilled, onrejected);
	}
	public getWrapped(): monaco.Thenable<T> {
		return this.wrapped;
	}
	public cancel(): void {
		this.wrapped.cancel();
	}
	public static resolve<T>(v: T | Thenable<T>): yamlService.Thenable<T> {
		return <monaco.Thenable<T>> monaco.Promise.as(v);
	}
	public static reject<T>(v: T): yamlService.Thenable<T> {
		return monaco.Promise.wrapError(<any>v);
	}
	public static all<T>(values: yamlService.Thenable<T>[]): yamlService.Thenable<T[]> {
		return monaco.Promise.join(values);
	}
}

// Currently we only support loading schemas via xhr:
const ajax = (url: string) =>
  new Promise((resolve, reject) => {
		const request = new XMLHttpRequest();
    request.onreadystatechange = () => {
      if (request.readyState === XMLHttpRequest.DONE) {
        const response = request.responseText;
        if (request.status < 400) {
          resolve(response);
        } else {
          reject(response);
        }
      }
    };
    request.onerror = reject;
		request.open('GET', url);
    request.send();
	});

export class YAMLWorker {

	private _ctx: IWorkerContext;
	private _languageService: yamlService.LanguageService;
	private _languageSettings: yamlService.LanguageSettings;
	private _languageId: string;

	constructor(ctx: IWorkerContext, createData: ICreateData) {
		this._ctx = ctx;
		this._languageSettings = createData.languageSettings;
		this._languageId = createData.languageId;
		this._languageService = yamlService.getLanguageService(ajax, null, [], null, PromiseAdapter);
		this._languageService.configure(this._languageSettings);
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
		let completionFix = completionHelper(document, position);
		let yamlDocument = this._languageService.parseYAMLDocument(document);
		return this._languageService.doComplete(document, position, yamlDocument);
	}
	doResolve(item: ls.CompletionItem): Thenable<ls.CompletionItem> {
		return this._languageService.doResolve(item);
	}
	doHover(uri: string, position: ls.Position): Thenable<ls.Hover> {
		let document = this._getTextDocument(uri);
		let yamlDocument = this._languageService.parseYAMLDocument(document)
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
	schemaRequestService?: SchemaRequestService;
}

export function create(ctx: IWorkerContext, createData: ICreateData): YAMLWorker {
	return new YAMLWorker(ctx, createData);
}

export function getLineOffsets(textDocString: String): number[] {

	let lineOffsets: number[] = [];
	let text = textDocString;
	let isLineStart = true;
	for (let i = 0; i < text.length; i++) {
		if (isLineStart) {
			lineOffsets.push(i);
			isLineStart = false;
		}
		let ch = text.charAt(i);
		isLineStart = (ch === '\r' || ch === '\n');
		if (ch === '\r' && i + 1 < text.length && text.charAt(i + 1) === '\n') {
			i++;
		}
	}
	if (isLineStart && text.length > 0) {
		lineOffsets.push(text.length);
	}

	return lineOffsets;
}

// https://github.com/redhat-developer/yaml-language-server/blob/5e069c0e9d7004d57f1fa6e93df670d4895883d1/src/server.ts#L453
function completionHelper(document: ls.TextDocument, textDocumentPosition: ls.Position) {

	//Get the string we are looking at via a substring
	let linePos = textDocumentPosition.line;
	let position = textDocumentPosition;
	let lineOffset = getLineOffsets(document.getText());
	let start = lineOffset[linePos]; //Start of where the autocompletion is happening
	let end = 0; //End of where the autocompletion is happening
	if (lineOffset[linePos + 1]) {
		end = lineOffset[linePos + 1];
	} else {
		end = document.getText().length;
	}
	let textLine = document.getText().substring(start, end);

	//Check if the string we are looking at is a node
	if (textLine.indexOf(":") === -1) {
		//We need to add the ":" to load the nodes
		let newText = "";

		//This is for the empty line case
		let trimmedText = textLine.trim();
		if (trimmedText.length === 0 || (trimmedText.length === 1 && trimmedText[0] === '-')) {
			//Add a temp node that is in the document but we don't use at all.
			if (lineOffset[linePos + 1]) {
				newText = document.getText().substring(0, start + (textLine.length - 1)) + "holder:\r\n" + document.getText().substr(end + 2);
			} else {
				newText = document.getText().substring(0, start + (textLine.length)) + "holder:\r\n" + document.getText().substr(end + 2);
			}
			//For when missing semi colon case
		} else {
			//Add a semicolon to the end of the current line so we can validate the node
			if (lineOffset[linePos + 1]) {
				newText = document.getText().substring(0, start + (textLine.length - 1)) + ":\r\n" + document.getText().substr(end + 2);
			} else {
				newText = document.getText().substring(0, start + (textLine.length)) + ":\r\n" + document.getText().substr(end + 2);
			}
		}

		return {
			"newText": newText,
			"newPosition": textDocumentPosition
		}

	} else {

		//All the nodes are loaded
		position.character = position.character - 1;
		return {
			"newText": document.getText(),
			"newPosition": position
		}
	}

}
