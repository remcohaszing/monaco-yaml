/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import {
  Color,
  ColorInformation,
  ColorPresentation,
  DocumentSymbol,
  Range,
  SymbolKind,
  TextDocument,
  TextEdit,
} from 'vscode-languageserver-types';
import { ASTNode, PropertyASTNode, Thenable } from '../jsonLanguageTypes';
import { getNodeValue } from '../parser/jsonParser';
import { colorFromHex } from '../utils/colors';
import { SingleYAMLDocument, YAMLDocument } from '../yamlLanguageTypes';
import { IJSONSchemaService } from './jsonSchemaService';

export class YAMLDocumentSymbols {
  constructor(private schemaService: IJSONSchemaService) {}

  public findDocumentSymbols(
    document: TextDocument,
    doc: YAMLDocument
  ): DocumentSymbol[] {
    if (!doc || doc.documents.length === 0) {
      return null;
    }

    const collectOutlineEntries = (
      result: DocumentSymbol[],
      node: ASTNode
    ): DocumentSymbol[] => {
      if (node.type === 'array') {
        node.items.forEach((node, index) => {
          if (node) {
            const range = getRange(document, node);
            const selectionRange = range;
            const name = String(index);
            const children = collectOutlineEntries([], node);
            result.push({
              name,
              kind: this.getSymbolKind(node.type),
              range,
              selectionRange,
              children,
            });
          }
        });
      } else if (node.type === 'object') {
        node.properties.forEach((property: PropertyASTNode) => {
          const valueNode = property.valueNode;
          if (valueNode) {
            const range = getRange(document, property);
            const selectionRange = getRange(document, property.keyNode);
            const name = property.keyNode.value;
            const children = collectOutlineEntries([], valueNode);
            result.push({
              name,
              kind: this.getSymbolKind(valueNode.type),
              range,
              selectionRange,
              children,
            });
          }
        });
      }
      return result;
    };

    let results = [];
    for (const yamlDoc of doc.documents) {
      if (yamlDoc.root) {
        const result = collectOutlineEntries([], yamlDoc.root);
        results = results.concat(result);
      }
    }

    return results;
  }

  public findDocumentColors(
    document: TextDocument,
    doc: YAMLDocument
  ): Thenable<ColorInformation[]> {
    if (!doc || doc.documents.length === 0) {
      return Promise.resolve([]);
    }

    const _findDocumentColors = (currentDoc: SingleYAMLDocument) => {
      return this.schemaService
        .getSchemaForResource(document.uri, currentDoc)
        .then(schema => {
          const result: ColorInformation[] = [];
          if (schema) {
            const matchingSchemas = currentDoc.getMatchingSchemas(
              schema.schema
            );
            const visitedNode = {};
            for (const s of matchingSchemas) {
              if (
                !s.inverted &&
                s.schema &&
                (s.schema.format === 'color' ||
                  s.schema.format === 'color-hex') &&
                s.node &&
                s.node.type === 'string'
              ) {
                const nodeId = String(s.node.offset);
                if (!visitedNode[nodeId]) {
                  const color = colorFromHex(getNodeValue(s.node));
                  if (color) {
                    const range = getRange(document, s.node);
                    result.push({ color, range });
                  }
                  visitedNode[nodeId] = true;
                }
              }
            }
          }
          return result;
        });
    };

    return Promise.all(
      doc.documents.map(currentDoc => _findDocumentColors(currentDoc))
    ).then(infoArray =>
      infoArray.reduce((acc, infos) => [...acc, ...infos], [])
    );
  }

  public getColorPresentations(
    document: TextDocument,
    doc: YAMLDocument,
    color: Color,
    range: Range
  ): ColorPresentation[] {
    const result: ColorPresentation[] = [];
    const red256 = Math.round(color.red * 255),
      green256 = Math.round(color.green * 255),
      blue256 = Math.round(color.blue * 255);

    function toTwoDigitHex(n: number): string {
      const r = n.toString(16);
      return r.length !== 2 ? '0' + r : r;
    }

    let label;
    if (color.alpha === 1) {
      label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(
        green256
      )}${toTwoDigitHex(blue256)}`;
    } else {
      label = `#${toTwoDigitHex(red256)}${toTwoDigitHex(
        green256
      )}${toTwoDigitHex(blue256)}${toTwoDigitHex(
        Math.round(color.alpha * 255)
      )}`;
    }
    result.push({
      label,
      textEdit: TextEdit.replace(range, JSON.stringify(label)),
    });

    return result;
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
      default:
        // 'null'
        return SymbolKind.Variable;
    }
  }
}

function getRange(document: TextDocument, node: ASTNode) {
  return Range.create(
    document.positionAt(node.offset),
    document.positionAt(node.offset + node.length)
  );
}
