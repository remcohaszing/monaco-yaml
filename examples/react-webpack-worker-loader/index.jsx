import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import MonacoEditor from 'react-monaco-editor';
import 'monaco-yaml/esm/monaco.contribution';
import { languages } from 'monaco-editor/esm/vs/editor/editor.api';

// NOTE: This will give you all editor featues. If you would prefer to limit to only the editor
// features you want to use, import them each individually. See this example: (https://github.com/microsoft/monaco-editor-samples/blob/master/browser-esm-webpack-small/index.js#L1-L91)
import 'monaco-editor';

// NOTE: using loader syntax becuase Yaml worker imports editor.worker directly and that
// import shouldn't go through loader syntax.
import EditorWorker from 'worker-loader!monaco-editor/esm/vs/editor/editor.worker';
import YamlWorker from 'worker-loader!monaco-yaml/esm/yaml.worker';

window.MonacoEnvironment = {
  getWorker(workerId, label) {
    if (label === 'yaml') {
      return new YamlWorker();
    }
    return new EditorWorker();
  },
};

const { yaml } = languages || {};

const Editor = () => {
  const [value, setValue] = useState('p1: ');
  useEffect(() => {
    yaml &&
      yaml.yamlDefaults.setDiagnosticsOptions({
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
  }, []);

  return (
    <MonacoEditor
      width="800"
      height="600"
      language="yaml"
      value={value}
      onChange={setValue}
    />
  );
};

ReactDOM.render(<Editor />, document.getElementById('react'));
