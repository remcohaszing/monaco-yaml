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

const uri = 'http://json.schemastore.org/bowerrc';
const languageSettings: LanguageSettings = {
  schemas: [],
  hover: true,
};
const fileMatch = ['*.yml', '*.yaml'];
languageSettings.schemas.push({ uri, fileMatch });
languageService.configure(languageSettings);

describe('Hover Tests', () => {
  describe('Yaml Hover with bowerrc', function() {
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

      it('Hover on key on root', done => {
        const content = 'cwd: test';
        const hover = parseSetup(content, 1);
        hover
          .then(function(result) {
            assert.notEqual(result.contents.length, 0);
          })
          .then(done, done);
      });

      it('Hover on value on root', done => {
        const content = 'cwd: test';
        const hover = parseSetup(content, 6);
        hover
          .then(function(result) {
            assert.notEqual(result.contents.length, 0);
          })
          .then(done, done);
      });

      it('Hover on key with depth', done => {
        const content = 'scripts:\n  postinstall: test';
        const hover = parseSetup(content, 15);
        hover
          .then(function(result) {
            assert.notEqual(result.contents.length, 0);
          })
          .then(done, done);
      });

      it('Hover on value with depth', done => {
        const content = 'scripts:\n  postinstall: test';
        const hover = parseSetup(content, 26);
        hover
          .then(function(result) {
            assert.notEqual(result.contents.length, 0);
          })
          .then(done, done);
      });

      it('Hover works on both root node and child nodes works', done => {
        const content = 'scripts:\n  postinstall: test';

        const firstHover = parseSetup(content, 3);
        firstHover.then(function(result) {
          assert.notEqual(result.contents.length, 0);
        });

        const secondHover = parseSetup(content, 15);
        secondHover
          .then(function(result) {
            assert.notEqual(result.contents.length, 0);
          })
          .then(done, done);
      });

      it('Hover does not show results when there isnt description field', done => {
        const content = 'analytics: true';
        const hover = parseSetup(content, 3);
        hover
          .then(function(result) {
            assert.notEqual(result.contents.length, 0);
          })
          .then(done, done);
      });

      it('Hover on multi document', done => {
        const content = '---\nanalytics: true\n...\n---\njson: test\n...';
        const hover = parseSetup(content, 30);
        hover
          .then(function(result) {
            assert.notEqual(result.contents.length, 0);
          })
          .then(done, done);
      });
    });
  });
});
