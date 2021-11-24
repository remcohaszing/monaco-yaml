const value = `
number: 0xfe
boolean: true
`;

async function create() {
  // Dynamic import is possible
  const { default: monaco } = await import('./main.js');

  // Define schema first
  monaco.languages.yaml.yamlDefaults.setDiagnosticsOptions({
    schemas: [
      {
        fileMatch: ['*'],
        uri: 'my-schema.json',
        schema: {
          type: 'object',
          properties: {
            number: {
              description: 'number property',
              type: 'number',
            },
          },
        },
      },
    ],
  });

  // Create editor
  monaco.editor.create(document.querySelector('.editor'), {
    language: 'yaml',
    tabSize: 2,
    value,
  });
}

create();
