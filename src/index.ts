import type { editor, IDisposable, MonacoEditor } from 'monaco-types'
import type { CompletionItemKind, Diagnostic } from 'vscode-languageserver-types'

import type { YAMLWorker } from './yaml.worker.js'

import {
  fromCodeActionTriggerType,
  fromFormattingOptions,
  fromPosition,
  fromRange,
  toCodeAction,
  toCodeLens,
  toCompletionList,
  toDocumentSymbol,
  toFoldingRange,
  toHover,
  toLink,
  toLocationLink,
  toMarkerData,
  toRange,
  toSelectionRanges,
  toTextEdit,
  toWorkspaceEdit
} from 'monaco-languageserver-types'
import { registerMarkerDataProvider } from 'monaco-marker-data-provider'
import { createWorkerManager } from 'monaco-worker-manager'

export interface JSONSchema {
  id?: string
  $id?: string
  $schema?: string
  url?: string
  type?: string | string[]
  title?: string
  closestTitle?: string
  versions?: Record<string, string>
  default?: unknown
  definitions?: Record<string, JSONSchema>
  description?: string
  properties?: Record<string, boolean | JSONSchema>
  patternProperties?: Record<string, boolean | JSONSchema>
  additionalProperties?: boolean | JSONSchema
  minProperties?: number
  maxProperties?: number
  dependencies?: Record<string, boolean | JSONSchema | string[]>
  items?: (boolean | JSONSchema)[] | boolean | JSONSchema
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  additionalItems?: boolean | JSONSchema
  pattern?: string
  minLength?: number
  maxLength?: number
  minimum?: number
  maximum?: number
  exclusiveMinimum?: boolean | number
  exclusiveMaximum?: boolean | number
  multipleOf?: number
  required?: string[]
  $ref?: string
  anyOf?: (boolean | JSONSchema)[]
  allOf?: (boolean | JSONSchema)[]
  oneOf?: (boolean | JSONSchema)[]
  not?: boolean | JSONSchema
  enum?: unknown[]
  format?: string
  const?: unknown
  contains?: boolean | JSONSchema
  propertyNames?: boolean | JSONSchema
  examples?: unknown[]
  $comment?: string
  if?: boolean | JSONSchema
  then?: boolean | JSONSchema
  else?: boolean | JSONSchema
  defaultSnippets?: {
    label?: string
    description?: string
    markdownDescription?: string
    type?: string
    suggestionKind?: CompletionItemKind
    sortText?: string
    body?: unknown
    bodyText?: string
  }[]
  errorMessage?: string
  patternErrorMessage?: string
  deprecationMessage?: string
  enumDescriptions?: string[]
  markdownEnumDescriptions?: string[]
  markdownDescription?: string
  doNotSuggest?: boolean
  allowComments?: boolean
  schemaSequence?: JSONSchema[]
  filePatternAssociation?: string
}

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
  schema?: JSONSchema

  /**
   * The source URI of the JSON schema. The JSON schema will be downloaded from here if no schema
   * was supplied. It will also be displayed as the source in hover tooltips.
   */
  uri: string
}

export interface FormatterOptions {
  /**
   * Print spaces between brackets in objects.
   *
   * @default true
   */
  readonly bracketSpacing?: boolean

  /**
   * Enable/disable default YAML formatter.
   *
   * @default true
   */
  readonly enable?: boolean

  /**
   * Specify the line length that the printer will wrap on.
   *
   * @default 80
   */
  readonly printWidth?: number

  /**
   * - `always`: wrap prose if it exceeds the print width.
   * - `never`: never wrap the prose,
   * - `preserve`: wrap prose as-is.
   *
   * @default `'preserve'`
   */
  readonly proseWrap?: 'always' | 'never' | 'preserve'

  /**
   * @default false
   */
  readonly singleQuote?: boolean

  /**
   * Specify if trailing commas should be used in JSON-like segments of the YAML.
   *
   * @default true
   */
  readonly trailingComma?: boolean
}

export interface MonacoYamlOptions {
  /**
   * If set, enable code lens.
   *
   * @default false
   */
  readonly codeLens?: boolean

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
   * Globally set `additionalProperties` to false if `additionalProperties` is not set and if
   * `schema.type` is `object`. So if is true, no extra properties are allowed inside yaml.
   *
   * @default false
   */
  readonly disableAdditionalProperties?: boolean

  /**
   * Disable adding not required properties with default values into completion text.
   *
   * @default false
   */
  readonly disableDefaultProperties?: boolean

  /**
   * If set, the schema service will load schema content on-demand.
   *
   * @default false
   */
  readonly enableSchemaRequest?: boolean

  /**
   * Control the use of flow mappings.
   *
   * @default 'allow'
   */
  readonly flowMapping?: 'allow' | 'forbid'

  /**
   * Control the use of flow sequences.
   *
   * @default 'allow'
   */
  readonly flowSequence?: 'allow' | 'forbid'

  /**
   * Formatting options.
   */
  readonly format?: FormatterOptions

  /**
   * If set, enable hover tips based the JSON schema.
   *
   * @default true
   */
  readonly hover?: boolean

  /**
   * Enable/disable hover feature for anchors
   *
   * @default true
   */
  readonly hoverAnchor?: boolean

  /**
   * Default indentation size
   *
   * @default '  '
   */
  readonly indentation?: string

  /**
   * If true, a different diffing algorithm is used to generate error messages.
   *
   * @default false
   */
  readonly isKubernetes?: boolean

  /**
   * If set enforce alphabetical ordering of keys in mappings.
   *
   * @default false
   */
  readonly keyOrdering?: boolean

  /**
   * If true, the user must select some parent skeleton first before autocompletion starts to
   * suggest the rest of the properties. When yaml object is not empty, autocompletion ignores
   * this setting and returns all properties and skeletons.
   *
   * @default false
   */
  readonly parentSkeletonSelectedFirst?: boolean

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
   * Default yaml lang version.
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

  /**
   * Get the current configuration of `monaco-yaml`.
   */
  getOptions: () => MonacoYamlOptions
}

/**
 * Merge two options objects.
 *
 * @param newOptions
 *   The new options to merge into with old options.
 * @param oldOptions
 *   The old options to merge the new options with.
 * @returns
 *   The options merged with the previous options.
 */
function mergeOptions(
  newOptions: MonacoYamlOptions,
  oldOptions: MonacoYamlOptions
): MonacoYamlOptions {
  return {
    ...oldOptions,
    ...newOptions,
    format: {
      ...oldOptions.format,
      ...newOptions.format
    }
  }
}

interface Togglable<T> {
  get: () => T | undefined
  toggle: (enabled: boolean | undefined) => undefined
}

function togglable<T extends IDisposable>(create: () => T): Togglable<T> {
  let disposable: T | undefined

  return {
    get(): T | undefined {
      return disposable
    },

    toggle(enabled) {
      if (enabled) {
        disposable ??= create()
      } else {
        disposable?.dispose()
        disposable = undefined
      }
    }
  }
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
export function configureMonacoYaml(
  monaco: MonacoEditor,
  options: MonacoYamlOptions = {}
): MonacoYaml {
  let createData = mergeOptions(options, {
    codeLens: false,
    completion: true,
    customTags: [],
    disableAdditionalProperties: false,
    disableDefaultProperties: false,
    enableSchemaRequest: false,
    flowMapping: 'allow',
    flowSequence: 'allow',
    format: {
      bracketSpacing: true,
      enable: true,
      printWidth: 80,
      proseWrap: 'preserve',
      singleQuote: false,
      trailingComma: true
    },
    hover: true,
    hoverAnchor: true,
    indentation: '  ',
    isKubernetes: false,
    keyOrdering: false,
    parentSkeletonSelectedFirst: false,
    schemas: [],
    validate: true,
    yamlVersion: '1.2'
  })

  monaco.languages.register({
    id: 'yaml',
    extensions: ['.yaml', '.yml'],
    aliases: ['YAML', 'yaml', 'YML', 'yml'],
    mimetypes: ['application/x-yaml']
  })

  const workerManager = createWorkerManager<YAMLWorker, MonacoYamlOptions>(monaco, {
    label: 'yaml',
    moduleId: 'monaco-yaml/yaml.worker',
    createData
  })

  const diagnosticMap = new WeakMap<editor.ITextModel, Diagnostic[] | undefined>()

  const codeLensProvider = togglable(() =>
    monaco.languages.registerCodeLensProvider('yaml', {
      async provideCodeLenses(model) {
        const worker = await workerManager.getWorker(model.uri)
        const lenses = await worker.getCodeLens(String(model.uri))

        if (lenses) {
          return {
            lenses: lenses.map(toCodeLens),
            dispose() {
              // This is required by the TypeScript interface, but it’s not implemented.
            }
          }
        }
      }
    })
  )

  const completionProvider = togglable(() =>
    monaco.languages.registerCompletionItemProvider('yaml', {
      triggerCharacters: [' ', ':'],

      async provideCompletionItems(model, position) {
        const wordInfo = model.getWordUntilPosition(position)
        const worker = await workerManager.getWorker(model.uri)
        const info = await worker.doComplete(String(model.uri), fromPosition(position))

        if (info) {
          return toCompletionList(info, {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: wordInfo.startColumn,
              endLineNumber: position.lineNumber,
              endColumn: wordInfo.endColumn
            }
          })
        }
      }
    })
  )

  const formatProvider = togglable(() =>
    monaco.languages.registerDocumentFormattingEditProvider('yaml', {
      displayName: 'yaml',

      async provideDocumentFormattingEdits(model) {
        const worker = await workerManager.getWorker(model.uri)
        const edits = await worker.format(String(model.uri))

        return edits?.map(toTextEdit)
      }
    })
  )

  const hoverProvider = togglable(() =>
    monaco.languages.registerHoverProvider('yaml', {
      async provideHover(model, position) {
        const worker = await workerManager.getWorker(model.uri)
        const info = await worker.doHover(String(model.uri), fromPosition(position))

        if (info) {
          return toHover(info)
        }
      }
    })
  )

  const validationProvider = togglable(() =>
    registerMarkerDataProvider(monaco, 'yaml', {
      owner: 'yaml',

      async provideMarkerData(model) {
        const worker = await workerManager.getWorker(model.uri)
        const diagnostics = await worker.doValidation(String(model.uri))

        diagnosticMap.set(model, diagnostics)

        return diagnostics?.map(toMarkerData)
      },

      async doReset(model) {
        const worker = await workerManager.getWorker(model.uri)
        await worker.resetSchema(String(model.uri))
      }
    })
  )

  function toggleAll(): undefined {
    codeLensProvider.toggle(createData.codeLens)
    completionProvider.toggle(createData.completion)
    formatProvider.toggle(createData.format?.enable)
    hoverProvider.toggle(createData.hover)
    validationProvider.toggle(createData.validate)
  }

  toggleAll()

  const disposables = [
    workerManager,

    monaco.languages.registerDefinitionProvider('yaml', {
      async provideDefinition(model, position) {
        const worker = await workerManager.getWorker(model.uri)
        const locationLinks = await worker.doDefinition(String(model.uri), fromPosition(position))

        return locationLinks?.map(toLocationLink)
      }
    }),

    monaco.languages.registerDocumentSymbolProvider('yaml', {
      displayName: 'yaml',

      async provideDocumentSymbols(model) {
        const worker = await workerManager.getWorker(model.uri)
        const items = await worker.findDocumentSymbols(String(model.uri))

        return items?.map(toDocumentSymbol)
      }
    }),

    monaco.languages.registerLinkProvider('yaml', {
      async provideLinks(model) {
        const worker = await workerManager.getWorker(model.uri)
        const links = await worker.findLinks(String(model.uri))

        if (links) {
          return {
            links: links.map(toLink)
          }
        }
      }
    }),

    monaco.languages.registerCodeActionProvider('yaml', {
      async provideCodeActions(model, range, context) {
        const worker = await workerManager.getWorker(model.uri)
        const codeActions = await worker.getCodeAction(String(model.uri), fromRange(range), {
          diagnostics:
            diagnosticMap
              .get(model)
              ?.filter((diagnostic) => range.intersectRanges(toRange(diagnostic.range))) || [],
          only: context.only ? [context.only] : undefined,
          triggerKind: fromCodeActionTriggerType(context.trigger)
        })

        if (codeActions) {
          return {
            actions: codeActions.map(toCodeAction),
            dispose() {
              // This is required by the TypeScript interface, but it’s not implemented.
            }
          }
        }
      }
    }),

    monaco.languages.registerFoldingRangeProvider('yaml', {
      async provideFoldingRanges(model) {
        const worker = await workerManager.getWorker(model.uri)
        const foldingRanges = await worker.getFoldingRanges(String(model.uri))

        return foldingRanges?.map(toFoldingRange)
      }
    }),

    monaco.languages.setLanguageConfiguration('yaml', {
      comments: {
        lineComment: '#'
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')']
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ]
    }),

    monaco.languages.registerOnTypeFormattingEditProvider('yaml', {
      autoFormatTriggerCharacters: ['\n'],

      async provideOnTypeFormattingEdits(model, position, ch, formattingOptions) {
        const worker = await workerManager.getWorker(model.uri)
        const edits = await worker.doDocumentOnTypeFormatting(
          String(model.uri),
          fromPosition(position),
          ch,
          fromFormattingOptions(formattingOptions)
        )

        return edits?.map(toTextEdit)
      }
    }),

    monaco.languages.registerRenameProvider('yaml', {
      async provideRenameEdits(model, position, newName) {
        const worker = await workerManager.getWorker(model.uri)
        const edit = await worker.doRename(String(model.uri), fromPosition(position), newName)

        if (edit) {
          return toWorkspaceEdit(edit)
        }
      },

      async resolveRenameLocation(model, position) {
        const worker = await workerManager.getWorker(model.uri)
        const range = await worker.prepareRename(String(model.uri), fromPosition(position))

        if (range) {
          return { range: toRange(range), text: '' }
        }
      }
    }),

    monaco.languages.registerSelectionRangeProvider('yaml', {
      async provideSelectionRanges(model, positions) {
        const worker = await workerManager.getWorker(model.uri)
        const selectionRanges = await worker.getSelectionRanges(
          String(model.uri),
          positions.map(fromPosition)
        )

        return selectionRanges?.map(toSelectionRanges)
      }
    })
  ]

  return {
    dispose() {
      codeLensProvider.get()?.dispose()
      completionProvider.get()?.dispose()
      formatProvider.get()?.dispose()
      hoverProvider.get()?.dispose()
      validationProvider.get()?.dispose()
      for (const disposable of disposables) {
        disposable.dispose()
      }
    },

    async update(newOptions) {
      createData = mergeOptions(newOptions, createData)
      workerManager.updateCreateData(createData)
      toggleAll()
      await validationProvider.get()?.revalidate()
    },

    getOptions() {
      return createData
    }
  }
}
