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
  value: 'p1: ',
  language: 'yaml',
});
