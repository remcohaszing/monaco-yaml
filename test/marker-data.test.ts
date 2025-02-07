import * as monaco from 'monaco-editor'
import { configureMonacoYaml, type SchemasSettings } from 'monaco-yaml'
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

  const markers = await new Promise<monaco.editor.IMarker[]>((resolve) => {
    const disposable = monaco.editor.onDidChangeMarkers(() => {
      disposable.dispose()
      resolve(monaco.editor.getModelMarkers({ resource }))
    })

    const model = monaco.editor.createModel('p1: \np2: \n', undefined, resource)
    monaco.editor.create(document.createElement('div'), { model })
  })

  expect(markers).toStrictEqual([
    {
      code: '0',
      endColumn: 5,
      endLineNumber: 1,
      message: 'Incorrect type. Expected "number".',
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
