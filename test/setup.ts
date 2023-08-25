import { configureMonacoYaml, type SchemasSettings } from 'monaco-yaml'
import { monaco } from 'playwright-monaco'

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
