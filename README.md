# Monaco YAML

YAML language plugin for the Monaco Editor. It provides the following features when editing YAML files:
* Code completion, based on JSON schemas or by looking at similar objects in the same file
* Hovers, based on JSON schemas
* Validation: Syntax errors and schema validation
* Formatting
* Document Symbols
* Syntax highlighting

Schemas can be provided by configuration. See [here](https://github.com/Microsoft/monaco-json/blob/master/src/monaco.d.ts)
for the API that the JSON plugin offers to configure the JSON language support.

## Installing

This npm module is bundled and distributed in the [monaco-editor](https://www.npmjs.com/package/monaco-editor) npm module.

## Development

* `git clone https://github.com/kpdecker/monaco-yaml`
* `cd monaco-yaml`
* `npm install .`
* `npm run watch`
* open `$/monaco-yaml/test/index.html` in your favorite browser.

## License
[MIT](https://github.com/kpdecker/monaco-yaml/blob/master/LICENSE.md)
