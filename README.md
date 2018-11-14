# Monaco YAML

YAML language plugin for the Monaco Editor. It provides the following features when editing YAML files:
* Code completion, based on JSON schemas or by looking at similar objects in the same file
* Hovers, based on JSON schemas
* Validation: Syntax errors and schema validation
* Formatting
* Document Symbols
* Syntax highlighting
* Automatically load remote schema files (by enabling DiagnosticsOptions.enableSchemaRequest)

Schemas can also be provided by configuration. See [here](https://github.com/Microsoft/monaco-json/blob/master/src/monaco.d.ts)
for the API that the JSON plugin offers to configure the JSON language support.

## Installing

`yarn add monaco-yaml`
See `test/index.html` as an example. Currently only load with vs loader is supported. (AMD)
Load with ESM is added, but not yet tested.

## Development

* `git clone https://github.com/kpdecker/monaco-yaml`
* `cd monaco-yaml`
* `yarn`
* `yarn watch`
* open `$/monaco-yaml/test/index.html` in your favorite browser.

A running example:
![demo-image](test-demo.png)

## Credits
- https://github.com/redhat-developer/yaml-language-server

### Maintain
Manually clone dependencies list below and update the project files accordingly:
- `src/languageservice`: https://github.com/redhat-developer/yaml-language-server
  - `cp yaml-language-server/src/languageservice monaco-yaml/src/languageservice`
  - Modify the import paths, go to the test page and see if it still works
- `src/yaml-ast-parser`: https://github.com/mulesoft-labs/yaml-ast-parser/tree/master/src

## License
[MIT](https://github.com/kpdecker/monaco-yaml/blob/master/LICENSE.md)
