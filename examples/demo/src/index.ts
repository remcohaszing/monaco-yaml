import './index.css'

import type { JSONSchemaForSchemaStoreOrgCatalogFiles } from '@schemastore/schema-catalog'
import type { Position } from 'monaco-editor'
import type { SchemasSettings } from 'monaco-yaml'

import * as monaco from 'monaco-editor'
import { ILanguageFeaturesService } from 'monaco-editor/esm/vs/editor/common/services/languageFeatures.js'
import { OutlineModel } from 'monaco-editor/esm/vs/editor/contrib/documentSymbols/browser/outlineModel.js'
import { StandaloneServices } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js'
import { configureMonacoYaml } from 'monaco-yaml'

import schema from './schema.json'

window.MonacoEnvironment = {
  getWorker(moduleId, label) {
    switch (label) {
      case 'editorWorkerService':
        return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url))
      case 'yaml':
        return new Worker(new URL('monaco-yaml/yaml.worker', import.meta.url))
      default:
        throw new Error(`Unknown label ${label}`)
    }
  }
}

const defaultSchema: SchemasSettings = {
  uri: 'https://github.com/remcohaszing/monaco-yaml/blob/HEAD/examples/demo/src/schema.json',
  schema,
  fileMatch: ['monaco-yaml.yaml']
}

const monacoYaml = configureMonacoYaml(monaco, {
  enableSchemaRequest: true,
  schemas: [defaultSchema]
})

const value = `
# Property descriptions are displayed when hovering over properties using your cursor
property: This property has a JSON schema description


# Titles work too!
titledProperty: Titles work too!


# Even markdown descriptions work
markdown: hover me to get a markdown based description 😮


# Enums can be autocompleted by placing the cursor after the colon and pressing Ctrl+Space
enum:


# Unused anchors will be reported
unused anchor: &unused anchor


# Of course numbers are supported!
number: 12


# As well as booleans!
boolean: true


# And strings
string: I am a string


# This property is using the JSON schema recursively
reference:
  boolean: Not a boolean


# Also works in arrays
array:
  - string: 12
    enum: Mewtwo
    reference:
      reference:
        boolean: true


# JSON referenses can be clicked for navigation
pointer:
  $ref: '#/array'


# This anchor can be referenced
anchorRef: &anchor can be clicked as well


# Press control while hovering over the anchor
anchorPointer: *anchor


formatting:       Formatting is supported too! Under the hood this is powered by Prettier. Just press Ctrl+Shift+I or right click and press Format to format this document.






`.replace(/:$/m, ': ')

const dark = matchMedia('(prefers-color-scheme: dark)')
monaco.editor.setTheme(dark.matches ? 'vs-dark' : 'vs-light')
dark.addEventListener('change', () => {
  monaco.editor.setTheme(dark.matches ? 'vs-dark' : 'vs-light')
})

const editor = monaco.editor.create(document.getElementById('editor')!, {
  automaticLayout: true,
  model: monaco.editor.createModel(value, 'yaml', monaco.Uri.parse('monaco-yaml.yaml')),
  quickSuggestions: {
    other: true,
    comments: false,
    strings: true
  },
  formatOnType: true
})

monaco.editor.addEditorAction({
  id: 'jumpToSchema',
  label: 'Jump to schema',
  run(ed, url) {
    window.open(url, '_blank')
  }
})

const select = document.getElementById('schema-selection') as HTMLSelectElement

// eslint-disable-next-line unicorn/prefer-top-level-await
fetch('https://www.schemastore.org/api/json/catalog.json').then(async (response) => {
  if (!response.ok) {
    return
  }
  const catalog = (await response.json()) as JSONSchemaForSchemaStoreOrgCatalogFiles
  const schemas = [defaultSchema]
  catalog.schemas.sort((a, b) => a.name.localeCompare(b.name))
  for (const { fileMatch, name, url } of catalog.schemas) {
    const match =
      typeof name === 'string' && fileMatch?.find((filename) => /\.ya?ml$/i.test(filename))
    if (!match) {
      continue
    }
    const option = document.createElement('option')
    option.value = match

    option.textContent = name
    select.append(option)
    schemas.push({
      fileMatch: [match],
      uri: url
    })
  }

  monacoYaml.update({ schemas })
})

select.addEventListener('change', () => {
  const oldModel = editor.getModel()
  const newModel = monaco.editor.createModel(
    oldModel?.getValue() ?? '',
    'yaml',
    monaco.Uri.parse(select.value)
  )
  editor.setModel(newModel)
  oldModel?.dispose()
})

interface OptionsForm extends HTMLFormElement {
  codeLens: HTMLInputElement
  completion: HTMLInputElement
  format: HTMLInputElement
  hover: HTMLInputElement
  validate: HTMLInputElement
}

const form = document.getElementById('options') as OptionsForm
form.addEventListener('change', () => {
  monacoYaml.update({
    codeLens: form.codeLens.checked,
    completion: form.completion.checked,
    format: {
      enable: form.format.checked
    },
    hover: form.hover.checked,
    validate: form.validate.checked
  })
})

/**
 * Get the document symbols that contain the given position.
 *
 * @param symbols
 *   The symbols to iterate.
 * @param position
 *   The position for which to filter document symbols.
 * @returns
 *   The document symbols that contain the given position.
 */
function* iterateSymbols(
  symbols: monaco.languages.DocumentSymbol[],
  position: Position
): Iterable<monaco.languages.DocumentSymbol> {
  for (const symbol of symbols) {
    if (monaco.Range.containsPosition(symbol.range, position)) {
      yield symbol
      if (symbol.children) {
        yield* iterateSymbols(symbol.children, position)
      }
    }
  }
}

editor.onDidChangeCursorPosition(async (event) => {
  const breadcrumbs = document.getElementById('breadcrumbs')!
  const { documentSymbolProvider } = StandaloneServices.get(ILanguageFeaturesService)
  const outline = await OutlineModel.create(documentSymbolProvider, editor.getModel()!)
  const symbols = outline.asListOfDocumentSymbols()
  while (breadcrumbs.lastChild) {
    breadcrumbs.lastChild.remove()
  }
  for (const symbol of iterateSymbols(symbols, event.position)) {
    const breadcrumb = document.createElement('span')
    breadcrumb.setAttribute('role', 'button')
    breadcrumb.classList.add('breadcrumb')
    breadcrumb.textContent = symbol.name
    breadcrumb.title = symbol.detail
    if (symbol.kind === monaco.languages.SymbolKind.Array) {
      breadcrumb.classList.add('array')
    } else if (symbol.kind === monaco.languages.SymbolKind.Module) {
      breadcrumb.classList.add('object')
    }
    breadcrumb.addEventListener('click', () => {
      editor.setPosition({
        lineNumber: symbol.range.startLineNumber,
        column: symbol.range.startColumn
      })
      editor.focus()
    })
    breadcrumbs.append(breadcrumb)
  }
})

monaco.editor.onDidChangeMarkers(([resource]) => {
  const problems = document.getElementById('problems')!
  const markers = monaco.editor.getModelMarkers({ resource })
  while (problems.lastChild) {
    problems.lastChild.remove()
  }
  for (const marker of markers) {
    if (marker.severity === monaco.MarkerSeverity.Hint) {
      continue
    }
    const wrapper = document.createElement('div')
    wrapper.setAttribute('role', 'button')
    const codicon = document.createElement('div')
    const text = document.createElement('div')
    wrapper.classList.add('problem')
    codicon.classList.add(
      'codicon',
      marker.severity === monaco.MarkerSeverity.Info
        ? 'codicon-info'
        : marker.severity === monaco.MarkerSeverity.Warning
          ? 'codicon-warning'
          : 'codicon-error'
    )
    text.classList.add('problem-text')
    text.textContent = marker.message
    wrapper.append(codicon, text)
    wrapper.addEventListener('click', () => {
      editor.setPosition({ lineNumber: marker.startLineNumber, column: marker.startColumn })
      editor.focus()
    })
    problems.append(wrapper)
  }
})
