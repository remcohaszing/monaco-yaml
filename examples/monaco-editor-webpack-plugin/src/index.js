import * as monaco from 'monaco-editor'
import { configureMonacoYaml } from 'monaco-yaml'

// The uri is used for the schema file match.
const modelUri = monaco.Uri.parse('a://b/foo.yaml')

configureMonacoYaml(monaco, {
  enableSchemaRequest: true,
  hover: true,
  completion: true,
  validate: true,
  format: true,
  schemas: [
    {
      // Id of the first schema
      uri: 'http://myserver/foo-schema.json',
      // Associate with our model
      fileMatch: [String(modelUri)],
      schema: {
        type: 'object',
        properties: {
          p1: {
            enum: ['v1', 'v2']
          },
          p2: {
            // Reference the second schema
            $ref: 'http://myserver/bar-schema.json'
          }
        }
      }
    },
    {
      // Id of the first schema
      uri: 'http://myserver/bar-schema.json',
      schema: {
        type: 'object',
        properties: {
          q1: {
            enum: ['x1', 'x2']
          }
        }
      }
    }
  ]
})

const value = 'p1: \np2: \n'

monaco.editor.create(document.getElementById('editor'), {
  automaticLayout: true,
  model: monaco.editor.createModel(value, 'yaml', modelUri)
})
