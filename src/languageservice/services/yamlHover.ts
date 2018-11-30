/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';


import * as Parser from '../parser/jsonParser';
import * as SchemaService from './jsonSchemaService';
import { JSONWorkerContribution } from '../jsonContributions';
import { Thenable } from 'vscode-json-languageservice';

import { Hover, TextDocument, Position, Range, MarkedString } from 'vscode-languageserver-types';
import { YAMLDocument } from '../yamlLanguageTypes';
import { matchOffsetToDocument } from '../utils/arrUtils';

export class YAMLHover {

  constructor(private schemaService: SchemaService.IJSONSchemaService, private contributions: JSONWorkerContribution[] = []) {
  }

	public doHover(document: TextDocument, position: Position, doc: YAMLDocument): Thenable<Hover> {

    let offset = document.offsetAt(position);
		let currentDoc = matchOffsetToDocument(offset, doc);
		if(currentDoc === null){
			return Promise.resolve(void 0);
		}
		const currentDocIndex = doc.documents.indexOf(currentDoc);
		let node = currentDoc.getNodeFromOffset(offset);
		if (!node || (node.type === 'object' || node.type === 'array') && offset > node.offset + 1 && offset < node.offset + node.length - 1) {
			return Promise.resolve(null);
		}
		let hoverRangeNode = node;

		// use the property description when hovering over an object key
		if (node.type === 'string') {
			let parent = node.parent;
			if (parent && parent.type === 'property' && parent.keyNode === node) {
				node = parent.valueNode;
				if (!node) {
					return Promise.resolve(null);
				}
			}
		}

		let hoverRange = Range.create(document.positionAt(hoverRangeNode.offset), document.positionAt(hoverRangeNode.offset + hoverRangeNode.length));

		var createHover = (contents: MarkedString[]) => {
			let result: Hover = {
				contents: contents,
				range: hoverRange
			};
			return result;
		};

		let location = Parser.getNodePath(node);
		for (let i = this.contributions.length - 1; i >= 0; i--) {
			let contribution = this.contributions[i];
			let promise = contribution.getInfoContribution(document.uri, location);
			if (promise) {
				return promise.then(htmlContent => createHover(htmlContent));
			}
		}

		return this.schemaService.getSchemaForResource(document.uri, currentDoc).then((schema) => {
			if (schema) {
				let matchingSchemas = currentDoc.getMatchingSchemas(schema.schema, node.offset);

				let title: string = null;
				let markdownDescription: string = null;
				let markdownEnumValueDescription = null, enumValue = null;
				matchingSchemas.forEach((s) => {
					if (s.node === node && !s.inverted && s.schema) {
						title = title || s.schema.title;
						markdownDescription = markdownDescription || s.schema.markdownDescription || toMarkdown(s.schema.description);
						if (s.schema.enum) {
							let idx = s.schema.enum.indexOf(Parser.getNodeValue(node));
							if (s.schema.markdownEnumDescriptions) {
								markdownEnumValueDescription = s.schema.markdownEnumDescriptions[idx];
							} else if (s.schema.enumDescriptions) {
								markdownEnumValueDescription = toMarkdown(s.schema.enumDescriptions[idx]);
							}
							if (markdownEnumValueDescription) {
								enumValue = s.schema.enum[idx];
								if (typeof enumValue !== 'string') {
									enumValue = JSON.stringify(enumValue);
								}
							}
						}
					}
					return true;
				});
				let result = '';
				if (title) {
					result = toMarkdown(title);
				}
				if (markdownDescription) {
					if (result.length > 0) {
						result += "\n\n";
					}
					result += markdownDescription;
				}
				if (markdownEnumValueDescription) {
					if (result.length > 0) {
						result += "\n\n";
					}
					result += `\`${toMarkdown(enumValue)}\`: ${markdownEnumValueDescription}`;
				}
				return createHover([result]);
			}
			return null;
		});
	}
}

function toMarkdown(plain: string) {
  if (plain) {
    let res = plain.replace(/([^\n\r])(\r?\n)([^\n\r])/gm, '$1\n\n$3'); // single new lines to \n\n (Markdown paragraph)
    return res.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&"); // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
  }
  return void 0;
}
