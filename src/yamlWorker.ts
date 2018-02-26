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

import * as yamlService from './yaml-languageservice/yamlLanguageService';
import * as ls from 'vscode-languageserver-types';
import { getLineOffsets } from './yaml-languageservice/utils/arrUtils';
import { parse as parseYAML } from "./yaml-languageservice/parser/yamlParser";

export class YAMLWorker {

	private _ctx: IWorkerContext;
	private _languageService: yamlService.LanguageService;
	private _languageSettings: yamlService.LanguageSettings;
	private _languageId: string;

	constructor(ctx: IWorkerContext, createData: ICreateData) {
		this._ctx = ctx;
		this._languageSettings = createData.languageSettings;
		this._languageId = createData.languageId;
		this._languageService = yamlService.getLanguageService();
		this._languageService.configure(this._languageSettings);
	}

	doValidation(uri: string): Thenable<ls.Diagnostic[]> {
		let document = this._getTextDocument(uri);
		if (document) {
			let jsonDocument = this._languageService.parseYAMLDocument(document);
			return this._languageService.doValidation(document, jsonDocument);
		}
		return Promise.as([]);
	}
	doComplete(uri: string, position: ls.Position): Thenable<ls.CompletionList> {
		let document = this._getTextDocument(uri);
		let completionFix = completionHelper(document, position);
		let newText = completionFix.newText;
		let jsonDocument = parseYAML(newText);
		return this._languageService.doComplete(document, position, jsonDocument);
	}
	doResolve(item: ls.CompletionItem): Thenable<ls.CompletionItem> {
		return this._languageService.doResolve(item);
	}
	doHover(uri: string, position: ls.Position): Thenable<ls.Hover> {
		let document = this._getTextDocument(uri);
		let jsonDocument = this._languageService.parseYAMLDocument(document);
		return this._languageService.doHover(document, position, jsonDocument);
	}
	format(uri: string, range: ls.Range, options: ls.FormattingOptions): Thenable<ls.TextEdit[]> {
		let document = this._getTextDocument(uri);
		let textEdits = this._languageService.format(document, options);
		return Promise.as(textEdits);
	}
	resetSchema(uri: string): Thenable<boolean> {
		return Promise.as(this._languageService.resetSchema(uri));
	}
	findDocumentSymbols(uri: string): Promise<ls.SymbolInformation[]> {
		let document = this._getTextDocument(uri);
		let jsonDocument = this._languageService.parseYAMLDocument(document);
		let symbols = this._languageService.findDocumentSymbols(document, jsonDocument);
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
}

export function create(ctx: IWorkerContext, createData: ICreateData): YAMLWorker {
	return new YAMLWorker(ctx, createData);
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
