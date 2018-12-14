/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { DiagnosticSeverity, TextDocument } from 'vscode-languageserver-types';
import { LanguageSettings } from '../yamlLanguageService';
import { YAMLDocument } from '../yamlLanguageTypes';
import { JSONSchemaService, ResolvedSchema } from './jsonSchemaService';

export class YAMLValidation {
  private validationEnabled: boolean;
  public constructor(private jsonSchemaService: JSONSchemaService) {
    this.validationEnabled = true;
  }

  public configure(raw: LanguageSettings) {
    if (raw) {
      this.validationEnabled = raw.validate;
    }
  }

  public doValidation(textDocument: TextDocument, yamlDocument: YAMLDocument) {
    if (!this.validationEnabled) {
      return Promise.resolve([]);
    }
    return this.jsonSchemaService
      .getSchemaForResource(textDocument.uri)
      .then(function(schema) {
        const diagnostics = [];
        const added = {};
        let newSchema = schema;
        if (schema) {
          let documentIndex = 0;
          for (const currentYAMLDoc in yamlDocument.documents) {
            const currentDoc = yamlDocument.documents[currentYAMLDoc];
            if (
              schema.schema &&
              schema.schema.schemaSequence &&
              schema.schema.schemaSequence[documentIndex]
            ) {
              newSchema = new ResolvedSchema(
                schema.schema.schemaSequence[documentIndex]
              );
            }
            const diagnostics = currentDoc.validate(
              textDocument,
              newSchema.schema
            );
            for (const diag in diagnostics) {
              const curDiagnostic = diagnostics[diag];
              currentDoc.errors.push({
                location: {
                  start: curDiagnostic.range.start,
                  end: curDiagnostic.range.end,
                },
                message: curDiagnostic.message,
              });
            }
            documentIndex++;
          }
        }
        if (newSchema && newSchema.errors.length > 0) {
          for (const curDiagnostic of newSchema.errors) {
            diagnostics.push({
              severity: DiagnosticSeverity.Error,
              range: {
                start: {
                  line: 0,
                  character: 0,
                },
                end: {
                  line: 0,
                  character: 1,
                },
              },
              message: curDiagnostic,
            });
          }
        }
        for (const currentYAMLDoc in yamlDocument.documents) {
          const currentDoc = yamlDocument.documents[currentYAMLDoc];
          currentDoc.errors
            .concat(currentDoc.warnings)
            .forEach(function(error, idx) {
              // remove duplicated messages
              const signature =
                error.location.start +
                ' ' +
                error.location.end +
                ' ' +
                error.message;
              if (!added[signature]) {
                added[signature] = true;
                const range = {
                  start: textDocument.positionAt(error.location.start),
                  end: textDocument.positionAt(error.location.end),
                };
                diagnostics.push({
                  severity:
                    idx >= currentDoc.errors.length
                      ? DiagnosticSeverity.Warning
                      : DiagnosticSeverity.Error,
                  range,
                  message: error.message,
                });
              }
            });
        }
        return diagnostics;
      });
  }
}
