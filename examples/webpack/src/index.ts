import './index.css';

import { editor, Environment } from 'monaco-editor/esm/vs/editor/editor.api';
import { setDiagnosticsOptions } from 'monaco-yaml';

// NOTE: This will give you all editor featues. If you would prefer to limit to only the editor
// features you want to use, import them each individually. See this example: (https://github.com/microsoft/monaco-editor-samples/blob/main/browser-esm-webpack-small/index.js#L1-L91)
import 'monaco-editor';

declare global {
  interface Window {
    MonacoEnvironment: Environment;
  }
}

window.MonacoEnvironment = {
  getWorker(moduleId, label) {
    switch (label) {
      case 'editorWorkerService':
        return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url));
      case 'yaml':
        return new Worker(new URL('monaco-yaml/lib/esm/yaml.worker', import.meta.url));
      default:
        throw new Error(`Unknown label ${label}`);
    }
  },
};

setDiagnosticsOptions({
  validate: true,
  enableSchemaRequest: true,
  format: true,
  hover: true,
  completion: true,
  schemas: [
    {
      // Id of the first schema
      uri: 'https://example.com/example-schema.json',
      // Associate with our model
      fileMatch: ['*'],
      schema: {
        // Id of the first schema
        id: 'https://example.com/example-schema.json',
        type: 'object',
        properties: {
          property: {
            description: 'I have a description',
          },
          titledProperty: {
            title: 'I have a title',
            description: 'I also have a description',
          },
          markdown: {
            markdownDescription: 'Even **markdown** _descriptions_ `are` ~~not~~ supported!',
          },
          enum: {
            description: 'Pick your starter',
            enum: ['Bulbasaur', 'Squirtle', 'Charmander', 'Pikachu'],
          },
          number: {
            description: 'Numbers work!',
            minimum: 42,
            maximum: 1337,
          },
          boolean: {
            description: 'Are boolean supported?',
            type: 'boolean',
          },
          string: {
            type: 'string',
          },
          reference: {
            description: 'JSON schemas can be referenced, even recursively',
            $ref: 'https://example.com/example-schema.json',
          },
          array: {
            description: 'It also works in arrays',
            items: {
              $ref: 'https://example.com/example-schema.json',
            },
          },
        },
      },
    },
  ],
});

const value = `
# Property descriptions are displayed when hovering over properties using your cursor
property: This property has a JSON schema description


# Titles work too!
titledProperty: Titles work too!


# Even markdown descriptions work
markdown: hover me to get a markdown based description 😮


# Enums can be autocompleted by placing the cursor after the colon and pressing Ctrl+Space
enum:


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


formatting:       Formatting is supported too! Under the hood this is powered by Prettier. Just press Ctrl+Shift+I or right click and press Format to format this document.






`.replace(/:$/m, ': ');

const ed = editor.create(document.getElementById('editor'), {
  automaticLayout: true,
  value,
  language: 'yaml',
  theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs-light',
});

editor.onDidChangeMarkers(([resource]) => {
  const problems = document.getElementById('problems');
  const markers = editor.getModelMarkers({ resource });
  while (problems.lastChild) {
    problems.lastChild.remove();
  }
  for (const marker of markers) {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('role', 'button');
    const codicon = document.createElement('div');
    const text = document.createElement('div');
    wrapper.classList.add('problem');
    codicon.classList.add('codicon', 'codicon-warning');
    text.classList.add('problem-text');
    text.textContent = marker.message;
    wrapper.append(codicon, text);
    wrapper.addEventListener(
      'click',
      () => {
        ed.setPosition({ lineNumber: marker.startLineNumber, column: marker.startColumn });
        ed.focus();
      },
      false,
    );
    problems.append(wrapper);
  }
});
