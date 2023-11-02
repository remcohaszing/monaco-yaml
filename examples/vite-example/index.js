import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import { configureMonacoYaml } from 'monaco-yaml'
import YamlWorker from 'monaco-yaml/yaml.worker?worker'

window.MonacoEnvironment = {
  getWorker(moduleId, label) {
    switch (label) {
      case 'editorWorkerService':
        return new EditorWorker()
      case 'yaml':
        return new YamlWorker()
      default:
        throw new Error(`Unknown label ${label}`)
    }
  }
}

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
  model: prettierc,
  quickSuggestions: {
    other: true,
    comments: false,
    strings: true
  }
})

const select = document.getElementById('model')
select.addEventListener('change', () => {
  editor.setModel(monaco.editor.getModel(monaco.Uri.parse(select.value)))
})
