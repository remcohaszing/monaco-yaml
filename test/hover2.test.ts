/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { TextDocument } from 'vscode-languageserver';
import { parse as parseYAML } from '../src/languageservice/parser/yamlParser';
import {
  getLanguageService,
  LanguageSettings,
} from '../src/languageservice/yamlLanguageService';
import { schemaRequestService, workspaceContext } from './testHelper';
const assert = require('assert');

const languageService = getLanguageService(
  schemaRequestService,
  workspaceContext,
  []
);

const uri = 'http://json.schemastore.org/composer';
const languageSettings: LanguageSettings = {
  schemas: [],
  hover: true,
};
const fileMatch = ['*.yml', '*.yaml'];
languageSettings.schemas.push({ uri, fileMatch });
languageService.configure(languageSettings);

describe('Hover Tests', () => {
  describe('Yaml Hover with composer schema', function() {
    describe('doComplete', function() {
      function setup(content: string) {
        return TextDocument.create(
          'file://~/Desktop/vscode-k8s/test.yaml',
          'yaml',
          0,
          content
        );
      }

      function parseSetup(content: string, position) {
        const testTextDocument = setup(content);
        const jsonDocument = parseYAML(testTextDocument.getText());
        return languageService.doHover(
          testTextDocument,
          testTextDocument.positionAt(position),
          jsonDocument
        );
      }

      it('Hover works on array nodes', done => {
        const content = 'authors:\n  - name: Josh';
        const hover = parseSetup(content, 14);
        hover
          .then(function(result) {
            assert.notEqual(result.contents.length, 0);
          })
          .then(done, done);
      });

      it('Hover works on array nodes 2', done => {
        const content = 'authors:\n  - name: Josh\n  - email: jp';
        const hover = parseSetup(content, 28);
        hover
          .then(function(result) {
            assert.notEqual(result.contents.length, 0);
          })
          .then(done, done);
      });
    });
  });
});
