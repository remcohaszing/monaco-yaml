import type { SchemasSettings } from 'monaco-yaml'

import * as monaco from 'monaco-editor'
import { configureMonacoYaml } from 'monaco-yaml'
import { d } from 'proxy-disposable'
import { expect, test } from 'vitest'

const schema: SchemasSettings = {
  fileMatch: ['*'],
  uri: 'http://schemas/my-schema.json',
  schema: {
    type: 'object',
    properties: {
      p1: {
        description: 'number property',
        type: 'number'
      },
      p2: {
        type: 'boolean'
      }
    }
  }
}

configureMonacoYaml(monaco, {
  schemas: [schema]
})

test('schema validation', async () => {
  const resource = monaco.Uri.parse('file:///example.yaml')

  const markers = Promise.withResolvers<monaco.editor.IMarker[]>()
  using onDidChangeMarkers = d(
    monaco.editor.onDidChangeMarkers(() =>
      markers.resolve(monaco.editor.getModelMarkers({ resource }))
    )
  )

  using model = d(monaco.editor.createModel('p1: \np2: \n', undefined, resource))
  using editor = d(monaco.editor.create(document.createElement('div'), { model }))

  expect(await markers.promise).toStrictEqual([
    {
      code: '0',
      endColumn: 5,
      endLineNumber: 1,
      message: 'Incorrect type. Expected "number".',
      origin: undefined,
      owner: 'yaml',
      relatedInformation: undefined,
      resource,
      severity: 4,
      source: 'yaml-schema: http://schemas/my-schema.json',
      startColumn: 5,
      startLineNumber: 1,
      tags: undefined
    },
    {
      code: '0',
      endColumn: 5,
      endLineNumber: 2,
      message: 'Incorrect type. Expected "boolean".',
      origin: undefined,
      owner: 'yaml',
      relatedInformation: undefined,
      resource,
      severity: 4,
      source: 'yaml-schema: http://schemas/my-schema.json',
      startColumn: 5,
      startLineNumber: 2,
      tags: undefined
    }
  ])
})
