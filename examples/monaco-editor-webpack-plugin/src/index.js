import * as monaco from 'monaco-editor'
import { configureMonacoYaml } from 'monaco-yaml'

configureMonacoYaml(monaco, {
  enableSchemaRequest: true,
  schemas: [
    {
      // If YAML file is opened matching this glob
      fileMatch: ['**/.prettierrc.*'],
      // Then this schema will be downloaded from the internet and used.
      uri: 'https://json.schemastore.org/prettierrc.json'
    },
    {
      // If YAML file is opened matching this glob
      fileMatch: ['**/person.yaml'],
      // The following schema will be applied
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The person’s display name'
          },
          age: {
            type: 'integer',
            description: 'How old is the person in years?'
          },
          occupation: {
            enum: ['Delivery person', 'Software engineer', 'Astronaut']
          }
        }
      },
      // And the following URI will be linked to as the source.
      uri: 'https://github.com/remcohaszing/monaco-yaml#usage'
    }
  ]
})

const prettierc = monaco.editor.createModel(
  'singleQuote: true\nproseWrap: always\nsemi: yes\n',
  undefined,
  monaco.Uri.parse('file:///.prettierrc.yaml')
)

monaco.editor.createModel(
  'name: John Doe\nage: 42\noccupation: Pirate\n',
  undefined,
  monaco.Uri.parse('file:///person.yaml')
)

const editor = monaco.editor.create(document.getElementById('editor'), {
  automaticLayout: true,
  model: prettierc
})

const select = document.getElementById('model')
select.addEventListener('change', () => {
  editor.setModel(monaco.editor.getModel(monaco.Uri.parse(select.value)))
})
