const { join } = require('path');

const helpers = require('monaco-plugin-helpers');

const REPO_ROOT = join(__dirname, '../');

helpers.packageESM({
  repoRoot: REPO_ROOT,
  esmSource: 'out/esm',
  esmDestination: 'lib/esm',
  entryPoints: ['monaco.contribution.js', 'yamlMode.js', 'yaml.worker.js'],
  resolveAlias: {
    'vscode-nls': join(REPO_ROOT, 'out/esm/fillers/vscode-nls.js'),
    'vscode-json-languageservice/lib/umd/services/jsonValidation': join(
      REPO_ROOT,
      'node_modules/vscode-json-languageservice/lib/esm/services/jsonValidation.js',
    ),
    'vscode-json-languageservice': join(
      REPO_ROOT,
      'node_modules/vscode-json-languageservice/lib/esm/jsonLanguageService.js',
    ),
    'vscode-json-languageservice/lib/umd/services/jsonHover': join(
      REPO_ROOT,
      'node_modules/vscode-json-languageservice/lib/esm/services/jsonHover.js',
    ),
    'vscode-json-languageservice/lib/umd/services/jsonDocumentSymbols': join(
      REPO_ROOT,
      'node_modules/vscode-json-languageservice/lib/esm/services/jsonDocumentSymbols.js',
    ),
    'vscode-json-languageservice/lib/umd/services/jsonSchemaService': join(
      REPO_ROOT,
      'node_modules/vscode-json-languageservice/lib/esm/services/jsonSchemaService.js',
    ),

    'vscode-json-languageservice/lib/umd/services/jsonCompletion': join(
      REPO_ROOT,
      'node_modules/vscode-json-languageservice/lib/esm/services/jsonCompletion.js',
    ),
    'vscode-json-languageservice/lib/umd/services/jsonDefinition': join(
      REPO_ROOT,
      'node_modules/vscode-json-languageservice/lib/esm/services/jsonDefinition.js',
    ),
    'yaml-language-server': join(
      REPO_ROOT,
      'node_modules/yaml-language-server/lib/esm/languageservice/yamlLanguageService.js',
    ),
    prettier: join(REPO_ROOT, 'node_modules/prettier/standalone.js'),
    'prettier/parser-yaml': join(REPO_ROOT, 'node_modules/prettier/parser-yaml.js'),
  },
  resolveSkip: ['monaco-editor', 'monaco-editor-core', 'js-yaml', 'yaml-ast-parser-custom-tags'],
  destinationFolderSimplification: {
    // eslint-disable-next-line camelcase
    node_modules: '_deps',
    'jsonc-parser/lib/esm': 'jsonc-parser',
    'vscode-languageserver-types/lib/esm': 'vscode-languageserver-types',
    'vscode-uri/lib/esm': 'vscode-uri',
  },
});
