import { JSONSchema4, JSONSchema6, JSONSchema7 } from 'json-schema';
import { IEvent, languages } from 'monaco-editor/esm/vs/editor/editor.api';

declare module 'monaco-editor/esm/vs/editor/editor.api' {
  namespace languages.yaml {
    export interface DiagnosticsOptions {
      /**
       * If set, enable schema based autocompletion.
       */
      readonly completion?: boolean;

      /**
       * If set, enable hover typs based the JSON schema.
       */
      readonly hover?: boolean;

      /**
       * If set, the validator will be enabled and perform syntax validation as well as schema
       * based validation.
       */
      readonly validate?: boolean;

      /**
       * A list of known schemas and/or associations of schemas to file names.
       */
      readonly schemas?: {
        /**
         * The URI of the schema, which is also the identifier of the schema.
         */
        readonly uri: string;
        /**
         * A list of file names that are associated to the schema. The '*' wildcard can be used.
         * For example '*.schema.json', 'package.json'
         */
        readonly fileMatch?: string[];
        /**
         * The schema for the given URI.
         */
        readonly schema?: JSONSchema4 | JSONSchema6 | JSONSchema7;
      }[];

      /**
       * If set, the schema service would load schema content on-demand with 'fetch' if available
       */
      readonly enableSchemaRequest?: boolean;
      /**
       * If specified, this prefix will be added to all on demand schema requests
       */
      readonly prefix?: string;
      /**
       * Whether or not kubernetes yaml is supported
       */
      readonly isKubernetes?: boolean;

      readonly format?: boolean;
    }

    export interface LanguageServiceDefaults {
      readonly onDidChange: IEvent<LanguageServiceDefaults>;
      readonly diagnosticsOptions: DiagnosticsOptions;
      setDiagnosticsOptions: (options: DiagnosticsOptions) => void;
    }

    export const yamlDefaults: LanguageServiceDefaults;
  }
}

/**
 * Configure `monaco-yaml` diagnostics options.
 *
 * @param options - The options to set.
 */
export function setDiagnosticsOptions(options?: languages.yaml.DiagnosticsOptions): void;
