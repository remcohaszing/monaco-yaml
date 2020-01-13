const requirejs = require('requirejs');
const path = require('path');
const fs = require('fs');
const UglifyES = require("uglify-es");
const helpers = require('monaco-plugin-helpers');

const REPO_ROOT = path.resolve(__dirname, '..');

const sha1 = helpers.getGitVersion(REPO_ROOT);
const semver = require('../package.json').version;
const headerVersion = semver + '(' + sha1 + ')';

const BUNDLED_FILE_HEADER = [
	'/*!-----------------------------------------------------------------------------',
	' * Copyright (c) Microsoft Corporation. All rights reserved.',
	' * monaco-yaml version: ' + headerVersion,
	' * Released under the MIT license',
	' * https://github.com/kpdecker/monaco-yaml/blob/master/LICENSE.md',
	' *-----------------------------------------------------------------------------*/',
	''
].join('\n');

bundleOne('monaco.contribution');
bundleOne('yamlMode');
bundleOne('yamlWorker');

function bundleOne(moduleId, exclude) {
	requirejs.optimize({
		baseUrl: 'out/amd/',
		name: 'vs/language/yaml/' + moduleId,
		out: 'lib/dev/' + moduleId + '.js',
		exclude: exclude,
		paths: {
			'vs/language/yaml': REPO_ROOT + '/out/amd'
		},
		optimize: 'none',
		packages: [
		{
			name: 'js-yaml',
			location: path.join(REPO_ROOT, 'node_modules/js-yaml/dist'),
			main: 'js-yaml'
		},
		// The following is required by YAML language service
		{
			name: 'vscode-json-languageservice',
			location: path.join(REPO_ROOT, 'node_modules/vscode-json-languageservice'),
      main: 'lib/umd/jsonLanguageService'
		},
		{
			name: 'vscode-languageserver-textdocument',
			location: path.join(REPO_ROOT, 'node_modules/vscode-languageserver-textdocument'),
      main: 'lib/umd/main'
		},
		{
			name: 'yaml-ast-parser-custom-tags',
			location: path.join(REPO_ROOT, 'node_modules/yaml-ast-parser-custom-tags'),
      main: 'dist/src/index'
		},
		{
			name: 'jsonc-parser',
			location: path.join(REPO_ROOT, 'node_modules/jsonc-parser/lib/umd'),
			main: 'main'
		},
	  {
			name: 'vscode-languageserver-types',
			location: path.join(REPO_ROOT, 'node_modules/vscode-languageserver-types/lib/umd'),
			main: 'main'
		}, {
			name: 'vscode-uri',
			location: path.join(REPO_ROOT, 'node_modules/vscode-uri/lib/umd'),
			main: 'index'
		}, {
			name: 'vscode-nls',
			location: path.join(REPO_ROOT, '/out/amd/fillers'),
			main: 'vscode-nls'
		}]
	}, function () {
		const devFilePath = path.join(REPO_ROOT, 'lib/dev/' + moduleId + '.js');
		const minFilePath = path.join(REPO_ROOT, 'lib/min/' + moduleId + '.js');
		const fileContents = fs.readFileSync(devFilePath).toString();
		console.log();
    console.log(`Minifying ${devFilePath}...`);
		const result = UglifyES.minify(fileContents, {
			output: {
				comments: 'some'
			}
		});
    console.log(`Done.`);
		try { fs.mkdirSync(path.join(REPO_ROOT, 'lib/min')) } catch (err) { }
    fs.writeFileSync(minFilePath, BUNDLED_FILE_HEADER + result.code);
	})
}
