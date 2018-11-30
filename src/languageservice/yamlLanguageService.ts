/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { JSONSchemaService, CustomSchemaProvider } from './services/jsonSchemaService'
import { TextDocument, Position, CompletionList, Diagnostic, FormattingOptions, DocumentSymbol, CompletionItem, Color, ColorInformation, ColorPresentation, Range } from 'vscode-languageserver-types';
import { JSONSchema } from './jsonSchema';
import { YAMLDocumentSymbols } from './services/documentSymbols';
import { YAMLCompletion } from './services/yamlCompletion';
import { YAMLHover } from './services/yamlHover';
import { YAMLValidation } from './services/yamlValidation';
import { format } from './services/yamlFormatter';
import { parse as parseYAML } from './parser/yamlParser';
import { JSONWorkerContribution } from './jsonContributions';
import { YAMLDocument } from './yamlLanguageTypes';

export interface LanguageSettings {
  validate?: boolean; //Setting for whether we want to validate the schema
  hover?: boolean; //Setting for whether we want to have hover results
  completion?: boolean; //Setting for whether we want to have completion results
  isKubernetes?: boolean; //If true then its validating against kubernetes
  schemas?: any[]; //List of schemas,
  customTags?: Array<String>; //Array of Custom Tags
}

export interface Thenable<R> {
  /**
  * Attaches callbacks for the resolution and/or rejection of the Promise.
  * @param onfulfilled The callback to execute when the Promise is resolved.
  * @param onrejected The callback to execute when the Promise is rejected.
  * @returns A Promise for the completion of which ever callback is executed.
  */
  then<TResult>(onfulfilled?: (value: R) => TResult | Thenable<TResult>, onrejected?: (reason: any) => TResult | Thenable<TResult>): Thenable<TResult>;
  then<TResult>(onfulfilled?: (value: R) => TResult | Thenable<TResult>, onrejected?: (reason: any) => void): Thenable<TResult>;
}

export interface WorkspaceContextService {
  resolveRelativePath(relativePath: string, resource: string): string;
}
/**
 * The schema request service is used to fetch schemas. The result should the schema file comment, or,
 * in case of an error, a displayable error string
 */
export interface SchemaRequestService {
  (uri: string): Thenable<string>;
}

export interface SchemaConfiguration {
	/**
	 * The URI of the schema, which is also the identifier of the schema.
	 */
  uri: string;
	/**
	 * A list of file names that are associated to the schema. The '*' wildcard can be used. For example '*.schema.json', 'package.json'
	 */
  fileMatch?: string[];
	/**
	 * The schema for the given URI.
	 * If no schema is provided, the schema will be fetched with the schema request service (if available).
	 */
  schema?: JSONSchema;
}

export interface LanguageService {
  configure(settings: LanguageSettings): void;
  registerCustomSchemaProvider(schemaProvider: CustomSchemaProvider): void; // Register a custom schema provider
  doComplete(document: TextDocument, position: Position, doc: YAMLDocument): Thenable<CompletionList>;
  doValidation(document: TextDocument, yamlDocument: YAMLDocument): Thenable<Diagnostic[]>;
  doHover(document: TextDocument, position: Position, doc: YAMLDocument);
  findDocumentSymbols(document: TextDocument, doc: YAMLDocument): DocumentSymbol[];
  findDocumentColors(document: TextDocument, doc: YAMLDocument): Thenable<ColorInformation[]>;
	getColorPresentations(document: TextDocument, doc: YAMLDocument, color: Color, range: Range): ColorPresentation[];
  doResolve(completionItem: CompletionItem): Thenable<CompletionItem>;
  resetSchema(uri: string): boolean;
  doFormat(document: TextDocument, options: FormattingOptions, customTags: Array<String>);
  parseYAMLDocument(document: TextDocument): YAMLDocument;
}

export function getLanguageService(schemaRequestService: SchemaRequestService, workspaceContext: WorkspaceContextService, contributions: JSONWorkerContribution[]): LanguageService {
  let schemaService = new JSONSchemaService(schemaRequestService, workspaceContext);

  let completer = new YAMLCompletion(schemaService, contributions);
  let hover = new YAMLHover(schemaService, contributions);
  let yamlDocumentSymbols = new YAMLDocumentSymbols(schemaService);
  let yamlValidation = new YAMLValidation(schemaService);

  return {
    configure: (settings) => {
      schemaService.clearExternalSchemas();
      if (settings.schemas) {
        settings.schemas.forEach(settings => {
          schemaService.registerExternalSchema(settings.uri, settings.fileMatch, settings.schema);
        });
      }
    },
    registerCustomSchemaProvider: (schemaProvider: CustomSchemaProvider) => {
      schemaService.registerCustomSchemaProvider(schemaProvider);
    },
    doComplete: completer.doComplete.bind(completer),
    doResolve: completer.doResolve.bind(completer),
    doValidation: yamlValidation.doValidation.bind(yamlValidation),
    doHover: hover.doHover.bind(hover),
    findDocumentSymbols: yamlDocumentSymbols.findDocumentSymbols.bind(yamlDocumentSymbols),
    findDocumentColors: yamlDocumentSymbols.findDocumentColors.bind(yamlDocumentSymbols),
		getColorPresentations: yamlDocumentSymbols.getColorPresentations.bind(yamlDocumentSymbols),
    resetSchema: (uri: string) => schemaService.onResourceChange(uri),
    doFormat: format,
    parseYAMLDocument: (document: TextDocument) => parseYAML(document.getText()),
  }
}
