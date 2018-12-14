/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { TextDocument } from 'vscode-languageserver';
import { parse as parseYAML } from '../src/languageservice/parser/yamlParser';
import { getLanguageService, LanguageSettings } from '../src/languageservice/yamlLanguageService';
import { schemaRequestService, workspaceContext } from './testHelper';
const assert = require('assert');

const languageService = getLanguageService(
  schemaRequestService,
  workspaceContext,
  [],
);

const uri = 'http://json.schemastore.org/bowerrc';
const languageSettings: LanguageSettings = {
  schemas: [],
  hover: false,
};
const fileMatch = ['*.yml', '*.yaml'];
languageSettings.schemas.push({ uri, fileMatch });
languageService.configure(languageSettings);

describe('Hover Setting Tests', () => {
  describe('Yaml Hover with bowerrc', function () {
    describe('doComplete', function () {
      function setup(content: string) {
        return TextDocument.create(
          'file://~/Desktop/vscode-k8s/test.yaml',
          'yaml',
          0,
          content,
        );
      }

      function parseSetup(content: string, position) {
        const testTextDocument = setup(content);
        const jsonDocument = parseYAML(testTextDocument.getText());
        return languageService.doHover(
          testTextDocument,
          testTextDocument.positionAt(position),
          jsonDocument,
        );
      }

      it('Hover should not return anything', (done) => {
        const content = 'cwd: test';
        const hover = parseSetup(content, 1);
        hover
          .then(function (result) {
            assert.equal(result, undefined);
          })
          .then(done, done);
      });
    });
  });
});
