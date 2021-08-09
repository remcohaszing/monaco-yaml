import './index.css';

import { editor } from 'monaco-editor/esm/vs/editor/editor.api';
import { setDiagnosticsOptions } from 'monaco-yaml';

// NOTE: This will give you all editor featues. If you would prefer to limit to only the editor
// features you want to use, import them each individually. See this example: (https://github.com/microsoft/monaco-editor-samples/blob/main/browser-esm-webpack-small/index.js#L1-L91)
import 'monaco-editor';

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
  hover: true,
  completion: true,
  schemas: [
    {
      // Id of the first schema
      uri: 'http://myserver/foo-schema.json',
      // Associate with our model
      fileMatch: ['*'],
      schema: {
        // Id of the first schema
        id: 'http://myserver/foo-schema.json',
        type: 'object',
        properties: {
          p1: {
            enum: ['v1', 'v2'],
          },
          p2: {
            // Reference the second schema
            $ref: 'http://myserver/bar-schema.json',
          },
        },
      },
    },
    {
      // Id of the first schema
      uri: 'http://myserver/bar-schema.json',
      schema: {
        // Id of the first schema
        id: 'http://myserver/bar-schema.json',
        type: 'object',
        properties: {
          q1: {
            enum: ['x1', 'x2'],
          },
        },
      },
    },
  ],
});

editor.create(document.getElementById('editor'), {
  automaticLayout: true,
  value: 'p1: ',
  language: 'yaml',
  theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs-light',
});
