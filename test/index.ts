import * as monaco from 'monaco-editor';
import { SchemasSettings, setDiagnosticsOptions } from 'monaco-yaml';

self.MonacoEnvironment = {
  getWorkerUrl(workerId, label) {
    if (label === 'yaml') {
      return 'out/yaml.worker.js';
    }
    return 'out/editor.worker.js';
  },
};

const schema: SchemasSettings = {
  fileMatch: ['*'],
  uri: 'http://schemas/my-schema.json',
  schema: {
    type: 'object',
    properties: {
      p1: {
        description: 'number property',
        type: 'number',
      },
      p2: {
        type: 'boolean',
      },
    },
  },
};

setDiagnosticsOptions({
  schemas: [schema],
});
const value = 'p1: \np2: \n';

monaco.editor.create(document.querySelector('#editor'), {
  language: 'yaml',
  tabSize: 2,
  value,
});
