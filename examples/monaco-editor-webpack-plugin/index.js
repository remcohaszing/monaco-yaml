const value = `
number: 0xfe
boolean: true
`;

async function create() {
  // eslint-disable-next-line import/extensions
  const monaco = await import('./main.js');

  monaco.editor.create(document.querySelector('.editor'), {
    language: 'yaml',
    tabSize: 2,
    value,
  });
}

create();
