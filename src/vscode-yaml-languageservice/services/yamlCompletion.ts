"use strict"

import { TextDocument } from "vscode-languageserver-types";

export function isInComment(document: TextDocument, start: number, offset: number) {
	const text = document.getText().substr(start, offset);
	return /(?:^|\s+)#/.test(text);
}