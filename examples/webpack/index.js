import './index.css';

import { editor, languages } from 'monaco-editor/esm/vs/editor/editor.api';
import 'monaco-yaml/lib/esm/monaco.contribution';

// NOTE: This will give you all editor featues. If you would prefer to limit to only the editor
// features you want to use, import them each individually. See this example: (https://github.com/microsoft/monaco-editor-samples/blob/master/browser-esm-webpack-small/index.js#L1-L91)
import 'monaco-editor';

window.MonacoEnvironment = {
  getWorkerUrl(moduleId, label) {
    if (label === 'yaml') {
      return './yaml.worker.bundle.js';
    }
    return './editor.worker.bundle.js';
  },
};

languages.yaml.yamlDefaults.setDiagnosticsOptions({
  validate: true,
  enableSchemaRequest: true,
  hover: true,
  completion: true,
  schemas: [
    {
      uri: 'http://myserver/foo-schema.json', // id of the first schema
      fileMatch: ['*'], // associate with our model
      schema: {
        id: 'http://myserver/foo-schema.json', // id of the first schema
        type: 'object',
        properties: {
          p1: {
            enum: ['v1', 'v2'],
          },
          p2: {
            $ref: 'http://myserver/bar-schema.json', // reference the second schema
          },
        },
      },
    },
    {
      uri: 'http://myserver/bar-schema.json', // id of the first schema
      schema: {
        id: 'http://myserver/bar-schema.json', // id of the first schema
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
  value: 'p1: ',
  language: 'yaml',
});
