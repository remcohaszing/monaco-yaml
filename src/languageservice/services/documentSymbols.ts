/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { SymbolKind, TextDocument, Range, DocumentSymbol, ColorInformation, ColorPresentation, Color, TextEdit } from 'vscode-languageserver-types';
import { ASTNode, PropertyASTNode, Thenable } from '../jsonLanguageTypes';
import { YAMLDocument, SingleYAMLDocument } from '../yamlLanguageTypes';
import { IJSONSchemaService } from './jsonSchemaService';
import { colorFromHex } from '../utils/colors';
import { getNodeValue } from '../parser/jsonParser';

export class YAMLDocumentSymbols {
  constructor(private schemaService: IJSONSchemaService) {
  }

  public findDocumentSymbols(document: TextDocument, doc: YAMLDocument): DocumentSymbol[] {
    if (!doc || doc.documents.length === 0) {
      return null;
    }

    let collectOutlineEntries = (result: DocumentSymbol[], node: ASTNode): DocumentSymbol[] => {
      if (node.type === 'array') {
        node.items.forEach((node, index) => {
          if (node) {
            let range = getRange(document, node);
            let selectionRange = range;
            let name = String(index);
            let children = collectOutlineEntries([], node);
            result.push({ name, kind: this.getSymbolKind(node.type), range, selectionRange, children });
          }
        });
      } else if (node.type === 'object') {
        node.properties.forEach((property: PropertyASTNode) => {
          let valueNode = property.valueNode;
          if (valueNode) {
            let range = getRange(document, property);
            let selectionRange = getRange(document, property.keyNode);
            let name = property.keyNode.value;
            let children = collectOutlineEntries([], valueNode);
            result.push({ name, kind: this.getSymbolKind(valueNode.type), range, selectionRange, children });
          }
        });
      }
      return result;
    };

    let results = [];
    for (let yamlDoc of doc.documents) {
      if (yamlDoc.root) {
        const result = collectOutlineEntries([], yamlDoc.root);
        results = results.concat(result);
      }
    }

    return results;
  }

  private getSymbolKind(nodeType: string): SymbolKind {
    switch (nodeType) {
      case 'object':
        return SymbolKind.Module;
      case 'string':
        return SymbolKind.String;
      case 'number':
        return SymbolKind.Number;
      case 'array':
        return SymbolKind.Array;
      case 'boolean':
        return SymbolKind.Boolean;
      default: // 'null'
        return SymbolKind.Variable;
    }
  }

  public findDocumentColors(document: TextDocument, doc: YAMLDocument): Thenable<ColorInformation[]> {
    if (!doc || doc.documents.length === 0) {
      return Promise.resolve([]);
    }

    const _findDocumentColors = (currentDoc: SingleYAMLDocument) => {
      return this.schemaService.getSchemaForResource(document.uri, currentDoc).then(schema => {
        let result: ColorInformation[] = [];
        if (schema) {
          let matchingSchemas = currentDoc.getMatchingSchemas(schema.schema);
          let visitedNode = {};
          for (let s of matchingSchemas) {
            if (!s.inverted && s.schema && (s.schema.format === 'color' || s.schema.format === 'color-hex') && s.node && s.node.type === 'string') {
              let nodeId = String(s.node.offset);
              if (!visitedNode[nodeId]) {
                let color = colorFromHex(getNodeValue(s.node));
                if (color) {
                  let range = getRange(document, s.node);
                  result.push({ color, range });
                }
                visitedNode[nodeId] = true;
              }
            }
          }
        }
        return result;
      });
    }

    return Promise.all(doc.documents.map(currentDoc => _findDocumentColors(currentDoc)))
      .then(infoArray => infoArray.reduce((acc, infos) => ([...acc, ...infos]), []));
  }

  public getColorPresentations(document: TextDocument, doc: YAMLDocument, color: Color, range: Range): ColorPresentation[] {
    let result: ColorPresentation[] = [];
    let red256 = Math.round(color.red * 255), green256 = Math.round(color.green * 255), blue256 = Math.round(color.blue * 255);

    function toTwoDigitHex(n: number): string {
      const r = n.toString(16);
      return r.length !== 2 ? '0' + r : r;
    }

    let label;
    if (color.alpha === 1) {
      label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}`;
    } else {
      label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(green256)}${toTwoDigitHex(blue256)}${toTwoDigitHex(Math.round(color.alpha * 255))}`;
    }
    result.push({ label: label, textEdit: TextEdit.replace(range, JSON.stringify(label)) });

    return result;
  }
}

function getRange(document: TextDocument, node: ASTNode) {
  return Range.create(document.positionAt(node.offset), document.positionAt(node.offset + node.length));
}
