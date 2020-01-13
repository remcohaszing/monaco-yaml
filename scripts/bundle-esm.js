/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const path = require("path");
const helpers = require("monaco-plugin-helpers");

const REPO_ROOT = path.join(__dirname, "../");

helpers.packageESM({
  repoRoot: REPO_ROOT,
  esmSource: "out/esm",
  esmDestination: "lib/esm",
  entryPoints: ["monaco.contribution.js", "yamlMode.js", "yaml.worker.js"],
  resolveAlias: {
    "vscode-nls": path.join(REPO_ROOT, "out/esm/fillers/vscode-nls.js"),
    "vscode-json-languageservice/lib/umd/services/jsonValidation": path.join(REPO_ROOT, 'node_modules/vscode-json-languageservice/lib/esm/services/jsonValidation.js'),
    "vscode-json-languageservice": path.join(REPO_ROOT, "node_modules/vscode-json-languageservice/lib/esm/jsonLanguageService.js"),
    "vscode-json-languageservice/lib/umd/services/jsonHover": path.join(REPO_ROOT, 'node_modules/vscode-json-languageservice/lib/esm/services/jsonHover.js'),
    "vscode-json-languageservice/lib/umd/services/jsonDocumentSymbols": path.join(REPO_ROOT, 'node_modules/vscode-json-languageservice/lib/esm/services/jsonDocumentSymbols.js'),
    "vscode-json-languageservice/lib/umd/services/jsonSchemaService": path.join(REPO_ROOT, 'node_modules/vscode-json-languageservice/lib/esm/services/jsonSchemaService.js'),
  },
  resolveSkip: ["monaco-editor", "monaco-editor-core", "js-yaml"],
  destinationFolderSimplification: {
    node_modules: "_deps",
    "jsonc-parser/lib/esm": "jsonc-parser",
    "vscode-languageserver-types/lib/esm": "vscode-languageserver-types",
    "vscode-uri/lib/esm": "vscode-uri",
    // "vscode-json-languageservice/lib/umd": "vscode-json-languageservice/lib/esm",
    // "js-yaml/dist": "js-yaml"
  }
});
