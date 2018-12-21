/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as Json from 'jsonc-parser';
import URI from 'vscode-uri';
import { JSONSchema, JSONSchemaMap, JSONSchemaRef } from '../jsonSchema';
import * as Parser from '../parser/jsonParser';
import * as Strings from '../utils/strings';
import {
  SchemaRequestService,
  Thenable,
  WorkspaceContextService,
} from '../yamlLanguageService';

import * as nls from 'vscode-nls';
const localize = nls.loadMessageBundle();

export declare type CustomSchemaProvider = (uri: string) => Thenable<string>;

export interface IJSONSchemaService {
  /**
   * Registers a schema file in the current workspace to be applicable to files that match the pattern
   */
  registerExternalSchema(
    uri: string,
    filePatterns?: string[],
    unresolvedSchema?: JSONSchema
  ): ISchemaHandle;

  /**
   * Clears all cached schema files
   */
  clearExternalSchemas(): void;

  /**
   * Registers contributed schemas
   */
  setSchemaContributions(schemaContributions: ISchemaContributions): void;

  /**
   * Looks up the appropriate schema for the given URI
   */
  getSchemaForResource(
    resource: string,
    document?: Parser.JSONDocument
  ): Thenable<ResolvedSchema>;

  /**
   * Returns all registered schema ids
   */
  getRegisteredSchemaIds(filter?: (scheme) => boolean): string[];
}

export interface ISchemaAssociations {
  [pattern: string]: string[];
}

export interface ISchemaContributions {
  schemas?: { [id: string]: JSONSchema };
  schemaAssociations?: ISchemaAssociations;
}

export interface ISchemaHandle {
  /**
   * The schema id
   */
  url: string;

  /**
   * The schema from the file, with potential $ref references
   */
  getUnresolvedSchema(): Thenable<UnresolvedSchema>;

  /**
   * The schema from the file, with references resolved
   */
  getResolvedSchema(): Thenable<ResolvedSchema>;
}

class FilePatternAssociation {
  private schemas: string[];
  private patternRegExp: RegExp;

  constructor(pattern: string) {
    try {
      this.patternRegExp = new RegExp(
        Strings.convertSimple2RegExpPattern(pattern) + '$'
      );
    } catch (e) {
      // invalid pattern
      this.patternRegExp = null;
    }
    this.schemas = [];
  }

  public addSchema(id: string) {
    this.schemas.push(id);
  }

  public matchesPattern(fileName: string): boolean {
    return this.patternRegExp && this.patternRegExp.test(fileName);
  }

  public getSchemas() {
    return this.schemas;
  }
}

class SchemaHandle implements ISchemaHandle {
  public url: string;

  private resolvedSchema: Thenable<ResolvedSchema>;
  private unresolvedSchema: Thenable<UnresolvedSchema>;
  private service: JSONSchemaService;

  constructor(
    service: JSONSchemaService,
    url: string,
    unresolvedSchemaContent?: JSONSchema
  ) {
    this.service = service;
    this.url = url;
    if (unresolvedSchemaContent) {
      this.unresolvedSchema = Promise.resolve(
        new UnresolvedSchema(unresolvedSchemaContent)
      );
    }
  }

  public getUnresolvedSchema(): Thenable<UnresolvedSchema> {
    if (!this.unresolvedSchema) {
      this.unresolvedSchema = this.service.loadSchema(this.url);
    }
    return this.unresolvedSchema;
  }

  public getResolvedSchema(): Thenable<ResolvedSchema> {
    if (!this.resolvedSchema) {
      this.resolvedSchema = this.getUnresolvedSchema().then(unresolved => {
        return this.service.resolveSchemaContent(unresolved, this.url);
      });
    }
    return this.resolvedSchema;
  }

  public clearSchema(): void {
    this.resolvedSchema = null;
    this.unresolvedSchema = null;
  }
}

export class UnresolvedSchema {
  public schema: JSONSchema;
  public errors: string[];

  constructor(schema: JSONSchema, errors: string[] = []) {
    this.schema = schema;
    this.errors = errors;
  }
}

export class ResolvedSchema {
  public schema: JSONSchema;
  public errors: string[];

  constructor(schema: JSONSchema, errors: string[] = []) {
    this.schema = schema;
    this.errors = errors;
  }

  public getSection(path: string[]): JSONSchema {
    return Parser.asSchema(this.getSectionRecursive(path, this.schema));
  }

  private getSectionRecursive(
    path: string[],
    schema: JSONSchemaRef
  ): JSONSchemaRef {
    if (!schema || typeof schema === 'boolean' || path.length === 0) {
      return schema;
    }
    const next = path.shift();

    if (schema.properties && typeof schema.properties[next]) {
      return this.getSectionRecursive(path, schema.properties[next]);
    } else if (schema.patternProperties) {
      for (const pattern of Object.keys(schema.patternProperties)) {
        const regex = new RegExp(pattern);
        if (regex.test(next)) {
          return this.getSectionRecursive(
            path,
            schema.patternProperties[pattern]
          );
        }
      }
    } else if (typeof schema.additionalProperties === 'object') {
      return this.getSectionRecursive(path, schema.additionalProperties);
    } else if (next.match('[0-9]+')) {
      if (Array.isArray(schema.items)) {
        const index = parseInt(next, 10);
        if (!isNaN(index) && schema.items[index]) {
          return this.getSectionRecursive(path, schema.items[index]);
        }
      } else if (schema.items) {
        return this.getSectionRecursive(path, schema.items);
      }
    }

    return null;
  }
}

export class JSONSchemaService implements IJSONSchemaService {
  private contributionSchemas: { [id: string]: SchemaHandle };
  private contributionAssociations: { [id: string]: string[] };

  private schemasById: { [id: string]: SchemaHandle };
  private filePatternAssociations: FilePatternAssociation[];
  private filePatternAssociationById: { [id: string]: FilePatternAssociation };
  private registeredSchemasIds: { [id: string]: boolean };

  private contextService: WorkspaceContextService;
  private callOnDispose: Function[];
  private requestService: SchemaRequestService;
  private customSchemaProvider: CustomSchemaProvider | undefined;

  constructor(
    requestService: SchemaRequestService,
    contextService?: WorkspaceContextService
  ) {
    this.contextService = contextService;
    this.requestService = requestService;
    this.callOnDispose = [];

    this.contributionSchemas = {};
    this.contributionAssociations = {};
    this.schemasById = {};
    this.filePatternAssociations = [];
    this.filePatternAssociationById = {};
    this.registeredSchemasIds = {};
  }

  public getRegisteredSchemaIds(filter?: (scheme) => boolean): string[] {
    return Object.keys(this.registeredSchemasIds).filter(id => {
      const scheme = URI.parse(id).scheme;
      return scheme !== 'schemaservice' && (!filter || filter(scheme));
    });
  }

  public registerCustomSchemaProvider(
    customSchemaProvider: CustomSchemaProvider
  ) {
    this.customSchemaProvider = customSchemaProvider;
  }

  public dispose(): void {
    while (this.callOnDispose.length > 0) {
      this.callOnDispose.pop()();
    }
  }

  public onResourceChange(uri: string): boolean {
    uri = this.normalizeId(uri);
    const schemaFile = this.schemasById[uri];
    if (schemaFile) {
      schemaFile.clearSchema();
      return true;
    }
    return false;
  }

  public setSchemaContributions(
    schemaContributions: ISchemaContributions
  ): void {
    if (schemaContributions.schemas) {
      const schemas = schemaContributions.schemas;
      for (const id in schemas) {
        const normalizedId = this.normalizeId(id);
        this.contributionSchemas[normalizedId] = this.addSchemaHandle(
          normalizedId,
          schemas[id]
        );
      }
    }
    if (schemaContributions.schemaAssociations) {
      const schemaAssociations = schemaContributions.schemaAssociations;
      for (const pattern in schemaAssociations) {
        const associations = schemaAssociations[pattern];
        this.contributionAssociations[pattern] = associations;

        const fpa = this.getOrAddFilePatternAssociation(pattern);
        for (const schemaId of associations) {
          const id = this.normalizeId(schemaId);
          fpa.addSchema(id);
        }
      }
    }
  }

  public registerExternalSchema(
    uri: string,
    filePatterns: string[] = null,
    unresolvedSchemaContent?: JSONSchema
  ): ISchemaHandle {
    const id = this.normalizeId(uri);
    this.registeredSchemasIds[id] = true;

    if (filePatterns) {
      for (const pattern of filePatterns) {
        this.getOrAddFilePatternAssociation(pattern).addSchema(id);
      }
    }
    return unresolvedSchemaContent
      ? this.addSchemaHandle(id, unresolvedSchemaContent)
      : this.getOrAddSchemaHandle(id);
  }

  public clearExternalSchemas(): void {
    this.schemasById = {};
    this.filePatternAssociations = [];
    this.filePatternAssociationById = {};
    this.registeredSchemasIds = {};

    for (const id in this.contributionSchemas) {
      this.schemasById[id] = this.contributionSchemas[id];
      this.registeredSchemasIds[id] = true;
    }
    for (const pattern in this.contributionAssociations) {
      const fpa = this.getOrAddFilePatternAssociation(pattern);
      for (const schemaId of this.contributionAssociations[pattern]) {
        const id = this.normalizeId(schemaId);
        fpa.addSchema(id);
      }
    }
  }

  public getResolvedSchema(schemaId: string): Thenable<ResolvedSchema> {
    const id = this.normalizeId(schemaId);
    const schemaHandle = this.schemasById[id];
    if (schemaHandle) {
      return schemaHandle.getResolvedSchema();
    }
    return Promise.resolve(null);
  }

  public loadSchema(url: string): Thenable<UnresolvedSchema> {
    if (!this.requestService) {
      const errorMessage = localize(
        'json.schema.norequestservice',
        "Unable to load schema from '{0}'. No schema request service available",
        toDisplayString(url)
      );
      return Promise.resolve(
        new UnresolvedSchema({} as JSONSchema, [errorMessage])
      );
    }
    return this.requestService(url).then(
      content => {
        if (!content) {
          const errorMessage = localize(
            'json.schema.nocontent',
            "Unable to load schema from '{0}': No content.",
            toDisplayString(url)
          );
          return new UnresolvedSchema({} as JSONSchema, [errorMessage]);
        }

        let schemaContent: JSONSchema = {};
        const jsonErrors: Json.ParseError[] = [];
        schemaContent = Json.parse(content, jsonErrors);
        const errors = jsonErrors.length
          ? [
              localize(
                'json.schema.invalidFormat',
                "Unable to parse content from '{0}': Parse error at offset {1}.",
                toDisplayString(url),
                jsonErrors[0].offset
              ),
            ]
          : [];
        return new UnresolvedSchema(schemaContent, errors);
      },
      (error: any) => {
        let errorMessage = error.toString();
        const errorSplit = error.toString().split('Error: ');
        if (errorSplit.length > 1) {
          // more concise error message, URL and context are attached by caller anyways
          errorMessage = errorSplit[1];
        }
        return new UnresolvedSchema({} as JSONSchema, [errorMessage]);
      }
    );
  }

  public resolveSchemaContent(
    schemaToResolve: UnresolvedSchema,
    schemaURL: string
  ): Thenable<ResolvedSchema> {
    const resolveErrors: string[] = schemaToResolve.errors.slice(0);
    const schema = schemaToResolve.schema;
    const contextService = this.contextService;

    const findSection = (schema: JSONSchema, path: string): any => {
      if (!path) {
        return schema;
      }
      let current: any = schema;
      if (path[0] === '/') {
        path = path.substr(1);
      }
      path.split('/').some(part => {
        current = current[part];
        return !current;
      });
      return current;
    };

    const merge = (
      target: JSONSchema,
      sourceRoot: JSONSchema,
      sourceURI: string,
      path: string
    ): void => {
      const section = findSection(sourceRoot, path);
      if (section) {
        for (const key in section) {
          if (section.hasOwnProperty(key) && !target.hasOwnProperty(key)) {
            target[key] = section[key];
          }
        }
      } else {
        resolveErrors.push(
          localize(
            'json.schema.invalidref',
            "$ref '{0}' in '{1}' can not be resolved.",
            path,
            sourceURI
          )
        );
      }
    };

    const resolveExternalLink = (
      node: JSONSchema,
      uri: string,
      linkPath: string,
      parentSchemaURL: string
    ): Thenable<any> => {
      if (contextService && !/^\w+:\/\/.*/.test(uri)) {
        uri = contextService.resolveRelativePath(uri, parentSchemaURL);
      }
      uri = this.normalizeId(uri);
      return this.getOrAddSchemaHandle(uri)
        .getUnresolvedSchema()
        .then(unresolvedSchema => {
          if (unresolvedSchema.errors.length) {
            const loc = linkPath ? uri + '#' + linkPath : uri;
            resolveErrors.push(
              localize(
                'json.schema.problemloadingref',
                "Problems loading reference '{0}': {1}",
                loc,
                unresolvedSchema.errors[0]
              )
            );
          }
          merge(node, unresolvedSchema.schema, uri, linkPath);
          return resolveRefs(node, unresolvedSchema.schema, uri);
        });
    };

    const resolveRefs = (
      node: JSONSchema,
      parentSchema: JSONSchema,
      parentSchemaURL: string
    ): Thenable<any> => {
      if (!node || typeof node !== 'object') {
        return Promise.resolve(null);
      }

      const toWalk: JSONSchema[] = [node];
      const seen: JSONSchema[] = [];

      const openPromises: Array<Thenable<any>> = [];

      const collectEntries = (...entries: JSONSchemaRef[]) => {
        for (const entry of entries) {
          if (typeof entry === 'object') {
            toWalk.push(entry);
          }
        }
      };
      const collectMapEntries = (...maps: JSONSchemaMap[]) => {
        for (const map of maps) {
          if (typeof map === 'object') {
            for (const key in map) {
              const entry = map[key];
              if (typeof entry === 'object') {
                toWalk.push(entry);
              }
            }
          }
        }
      };
      const collectArrayEntries = (...arrays: JSONSchemaRef[][]) => {
        for (const array of arrays) {
          if (Array.isArray(array)) {
            for (const entry of array) {
              if (typeof entry === 'object') {
                toWalk.push(entry);
              }
            }
          }
        }
      };
      const handleRef = (next: JSONSchema) => {
        while (next.$ref) {
          const segments = next.$ref.split('#', 2);
          delete next.$ref;
          if (segments[0].length > 0) {
            openPromises.push(
              resolveExternalLink(
                next,
                segments[0],
                segments[1],
                parentSchemaURL
              )
            );
            return;
          } else {
            merge(next, parentSchema, parentSchemaURL, segments[1]); // can set next.$ref again
          }
        }

        collectEntries(
          next.items as JSONSchema,
          next.additionalProperties as JSONSchema,
          next.not,
          next.contains,
          next.propertyNames,
          next.if,
          next.then,
          next.else
        );
        collectMapEntries(
          next.definitions,
          next.properties,
          next.patternProperties,
          next.dependencies as JSONSchemaMap
        );
        collectArrayEntries(
          next.anyOf,
          next.allOf,
          next.oneOf,
          next.items as JSONSchema[],
          next.schemaSequence
        );
      };

      while (toWalk.length) {
        const next = toWalk.pop();
        if (seen.indexOf(next) >= 0) {
          continue;
        }
        seen.push(next);
        handleRef(next);
      }
      return Promise.all(openPromises);
    };

    return resolveRefs(schema, schema, schemaURL).then(
      _ => new ResolvedSchema(schema, resolveErrors)
    );
  }

  public getSchemaForResource(
    resource: string,
    document?: Parser.JSONDocument
  ): Thenable<ResolvedSchema> {
    // first use $schema if present
    if (document && document.root && document.root.type === 'object') {
      const schemaProperties = document.root.properties.filter(
        p =>
          p.keyNode.value === '$schema' &&
          p.valueNode &&
          p.valueNode.type === 'string'
      );
      if (schemaProperties.length > 0) {
        let schemeId = Parser.getNodeValue(
          schemaProperties[0].valueNode
        ) as string;
        if (
          schemeId &&
          Strings.startsWith(schemeId, '.') &&
          this.contextService
        ) {
          schemeId = this.contextService.resolveRelativePath(
            schemeId,
            resource
          );
        }
        if (schemeId) {
          const id = this.normalizeId(schemeId);
          return this.getOrAddSchemaHandle(id).getResolvedSchema();
        }
      }
    }

    const seen: { [schemaId: string]: boolean } = Object.create(null);
    const schemas: string[] = [];
    for (const entry of this.filePatternAssociations) {
      if (entry.matchesPattern(resource)) {
        for (const schemaId of entry.getSchemas()) {
          if (!seen[schemaId]) {
            schemas.push(schemaId);
            seen[schemaId] = true;
          }
        }
      }
    }
    if (schemas.length > 0) {
      return this.createCombinedSchema(resource, schemas).getResolvedSchema();
    }

    return Promise.resolve(null);
  }

  private normalizeId(id: string) {
    // remove trailing '#', normalize drive capitalization
    return URI.parse(id).toString();
  }

  private addSchemaHandle(
    id: string,
    unresolvedSchemaContent?: JSONSchema
  ): SchemaHandle {
    const schemaHandle = new SchemaHandle(this, id, unresolvedSchemaContent);
    this.schemasById[id] = schemaHandle;
    return schemaHandle;
  }

  private getOrAddSchemaHandle(
    id: string,
    unresolvedSchemaContent?: JSONSchema
  ): ISchemaHandle {
    return (
      this.schemasById[id] || this.addSchemaHandle(id, unresolvedSchemaContent)
    );
  }

  private getOrAddFilePatternAssociation(pattern: string) {
    let fpa = this.filePatternAssociationById[pattern];
    if (!fpa) {
      fpa = new FilePatternAssociation(pattern);
      this.filePatternAssociationById[pattern] = fpa;
      this.filePatternAssociations.push(fpa);
    }
    return fpa;
  }

  private createCombinedSchema(
    resource: string,
    schemaIds: string[]
  ): ISchemaHandle {
    if (schemaIds.length === 1) {
      return this.getOrAddSchemaHandle(schemaIds[0]);
    } else {
      const combinedSchemaId =
        'schemaservice://combinedSchema/' + encodeURIComponent(resource);
      const combinedSchema: JSONSchema = {
        allOf: schemaIds.map(schemaId => ({ $ref: schemaId })),
      };
      return this.addSchemaHandle(combinedSchemaId, combinedSchema);
    }
  }
}

function toDisplayString(url: string) {
  try {
    const uri = URI.parse(url);
    if (uri.scheme === 'file') {
      return uri.fsPath;
    }
  } catch (e) {
    // ignore
  }
  return url;
}
