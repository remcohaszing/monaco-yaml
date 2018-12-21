/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { Thenable } from 'vscode-json-languageservice';
import { JSONWorkerContribution } from '../jsonContributions';
import * as Parser from '../parser/jsonParser';
import * as SchemaService from './jsonSchemaService';

import {
  Hover,
  MarkedString,
  Position,
  Range,
  TextDocument,
} from 'vscode-languageserver-types';
import { matchOffsetToDocument } from '../utils/arrUtils';
import { YAMLDocument } from '../yamlLanguageTypes';
import { LanguageSettings } from '../yamlLanguageService';

export class YAMLHover {
  private shouldHover = true;

  constructor(
    private schemaService: SchemaService.IJSONSchemaService,
    private contributions: JSONWorkerContribution[] = []
  ) {}

  public configure(languageSettings: LanguageSettings) {
    if (languageSettings) {
      this.shouldHover = languageSettings.hover !== false;
    }
  }

  public doHover(
    document: TextDocument,
    position: Position,
    doc: YAMLDocument
  ): Thenable<Hover> {
    const offset = document.offsetAt(position);
    const currentDoc = matchOffsetToDocument(offset, doc);
    if (currentDoc === null || !this.shouldHover) {
      return Promise.resolve(void 0);
    }
    let node = currentDoc.getNodeFromOffset(offset);
    const currentDocIndex = doc.documents.indexOf(currentDoc);
    if (
      !node ||
      ((node.type === 'object' || node.type === 'array') &&
        offset > node.offset + 1 &&
        offset < node.offset + node.length - 1)
    ) {
      return Promise.resolve(null);
    }
    const hoverRangeNode = node;

    // use the property description when hovering over an object key
    if (node.type === 'string') {
      const parent = node.parent;
      if (parent && parent.type === 'property' && parent.keyNode === node) {
        node = parent.valueNode;
        if (!node) {
          return Promise.resolve(null);
        }
      }
    }

    const hoverRange = Range.create(
      document.positionAt(hoverRangeNode.offset),
      document.positionAt(hoverRangeNode.offset + hoverRangeNode.length)
    );

    const createHover = (contents: MarkedString[]) => {
      const result: Hover = {
        contents,
        range: hoverRange,
      };
      return result;
    };

    const location = Parser.getNodePath(node);
    for (let i = this.contributions.length - 1; i >= 0; i--) {
      const contribution = this.contributions[i];
      const promise = contribution.getInfoContribution(document.uri, location);
      if (promise) {
        return promise.then(htmlContent => createHover(htmlContent));
      }
    }

    return this.schemaService
      .getSchemaForResource(document.uri, currentDoc)
      .then(schema => {
        if (schema) {
          let newSchema = schema;
          if (
            schema.schema &&
            schema.schema.schemaSequence &&
            schema.schema.schemaSequence[currentDocIndex]
          ) {
            newSchema = new SchemaService.ResolvedSchema(
              schema.schema.schemaSequence[currentDocIndex]
            );
          }

          const matchingSchemas = currentDoc.getMatchingSchemas(
            newSchema.schema,
            node.offset
          );

          let title: string = null;
          let markdownDescription: string = null;
          let markdownEnumValueDescription = null,
            enumValue = null;
          matchingSchemas.forEach(s => {
            if (s.node === node && !s.inverted && s.schema) {
              title = title || s.schema.title;
              markdownDescription =
                markdownDescription ||
                s.schema.markdownDescription ||
                toMarkdown(s.schema.description);
              if (s.schema.enum) {
                const idx = s.schema.enum.indexOf(Parser.getNodeValue(node));
                if (s.schema.markdownEnumDescriptions) {
                  markdownEnumValueDescription =
                    s.schema.markdownEnumDescriptions[idx];
                } else if (s.schema.enumDescriptions) {
                  markdownEnumValueDescription = toMarkdown(
                    s.schema.enumDescriptions[idx]
                  );
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
              result += '\n\n';
            }
            result += markdownDescription;
          }
          if (markdownEnumValueDescription) {
            if (result.length > 0) {
              result += '\n\n';
            }
            result += `\`${toMarkdown(
              enumValue
            )}\`: ${markdownEnumValueDescription}`;
          }
          return createHover([result]);
        }
        return null;
      });
  }
}

function toMarkdown(plain: string) {
  if (plain) {
    const res = plain.replace(/([^\n\r])(\r?\n)([^\n\r])/gm, '$1\n\n$3'); // single new lines to \n\n (Markdown paragraph)
    return res.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&'); // escape markdown syntax tokens: http://daringfireball.net/projects/markdown/syntax#backslash
  }
  return void 0;
}
