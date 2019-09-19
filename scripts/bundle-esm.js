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
    "vscode-nls": path.join(REPO_ROOT, "out/esm/fillers/vscode-nls.js")
  },
  resolveSkip: ["monaco-editor", "monaco-editor-core", "js-yaml"],
  destinationFolderSimplification: {
    node_modules: "_deps",
    "jsonc-parser/lib/esm": "jsonc-parser",
    "vscode-languageserver-types/lib/esm": "vscode-languageserver-types",
    "vscode-uri/lib/esm": "vscode-uri",
    // "js-yaml/dist": "js-yaml"
  }
});
