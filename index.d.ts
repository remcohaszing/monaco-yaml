import { type JSONSchema4, type JSONSchema6, type JSONSchema7 } from 'json-schema'
import { type IDisposable, type MonacoEditor } from 'monaco-types'

export interface SchemasSettings {
  /**
   * A `Uri` file match which will trigger the schema validation. This may be a glob or an exact
   * path.
   *
   * @example '.gitlab-ci.yml'
   * @example 'file://**\/.github/actions/*.yaml'
   */
  fileMatch: string[]

  /**
   * The JSON schema which will be used for validation. If not specified, it will be downloaded from
   * `uri`.
   */
  schema?: JSONSchema4 | JSONSchema6 | JSONSchema7

  /**
   * The source URI of the JSON schema. The JSON schema will be downloaded from here if no schema
   * was supplied. It will also be displayed as the source in hover tooltips.
   */
  uri: string
}

export interface MonacoYamlOptions {
  /**
   * If set, enable schema based autocompletion.
   *
   * @default true
   */
  readonly completion?: boolean

  /**
   * A list of custom tags.
   *
   * @default []
   */
  readonly customTags?: string[]

  /**
   * If set, the schema service will load schema content on-demand.
   *
   * @default false
   */
  readonly enableSchemaRequest?: boolean

  /**
   * If true, formatting using Prettier is enabled. Setting this to `false` does **not** exclude
   * Prettier from the bundle.
   *
   * @default true
   */
  readonly format?: boolean

  /**
   * If set, enable hover typs based the JSON schema.
   *
   * @default true
   */
  readonly hover?: boolean

  /**
   * If true, a different diffing algorithm is used to generate error messages.
   *
   * @default false
   */
  readonly isKubernetes?: boolean

  /**
   * A list of known schemas and/or associations of schemas to file names.
   *
   * @default []
   */
  readonly schemas?: SchemasSettings[]

  /**
   * If set, the validator will be enabled and perform syntax validation as well as schema
   * based validation.
   *
   * @default true
   */
  readonly validate?: boolean

  /**
   * The YAML version to use for parsing.
   *
   * @default '1.2'
   */
  readonly yamlVersion?: '1.1' | '1.2'
}

export interface MonacoYaml extends IDisposable {
  /**
   * Recondigure `monaco-yaml`.
   */
  update: (options: MonacoYamlOptions) => Promise<undefined>
}

/**
 * Configure `monaco-yaml`.
 *
 * > **Note**: There may only be one configured instance of `monaco-yaml` at a time.
 *
 * @param monaco
 *   The Monaco editor module. Typically you get this by importing `monaco-editor`. Third party
 *   integrations often expose it as the global `monaco` variable instead.
 * @param options
 *   Options to configure `monaco-yaml`
 * @returns
 *   A disposable object that can be used to update `monaco-yaml`
 */
export function configureMonacoYaml(monaco: MonacoEditor, options?: MonacoYamlOptions): MonacoYaml
