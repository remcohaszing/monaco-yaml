/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { TextDocument } from 'vscode-languageserver';
import { parse as parseYAML } from '../src/languageservice/parser/yamlParser';
import { getLanguageService } from '../src/languageservice/yamlLanguageService';
import { schemaRequestService, workspaceContext } from './testHelper';
import { DocumentSymbol } from 'vscode-languageserver-types';
const assert = require('assert');

const languageService = getLanguageService(
  schemaRequestService,
  workspaceContext,
  [],
);

// TODO: this suite is outdated and should be updated.
// https://github.com/Microsoft/vscode-json-languageservice/blob/master/src/test/documentSymbols.test.ts
xdescribe('Document Symbols Tests', () => {
  describe('Document Symbols Tests', function() {
    function setup(content: string) {
      return TextDocument.create(
        'file://~/Desktop/vscode-k8s/test.yaml',
        'yaml',
        0,
        content,
      );
    }

    function parseSetup(content: string) {
      const testTextDocument = setup(content);
      const jsonDocument = parseYAML(testTextDocument.getText());
      return languageService.findDocumentSymbols(
        testTextDocument,
        jsonDocument,
      );
    }

    it('Document is empty', (done) => {
      const content = '';
      const symbols = parseSetup(content);
      assert.equal(symbols, null);
      done();
    });

    it('Simple document symbols', (done) => {
      const content = 'cwd: test';
      const symbols = parseSetup(content);
      assert.equal(symbols.length, 1);
      done();
    });

    it('Document Symbols with number', (done) => {
      const content = 'node1: 10000';
      const symbols = parseSetup(content);
      assert.equal(symbols.length, 1);
      done();
    });

    it('Document Symbols with boolean', (done) => {
      const content = 'node1: False';
      const symbols = parseSetup(content);
      assert.equal(symbols.length, 1);
      done();
    });

    it('Document Symbols with object', (done) => {
      const content = 'scripts:\n  node1: test\n  node2: test';
      const symbols = parseSetup(content);
      assert.equal(symbols.length, 3);
      done();
    });

    it('Document Symbols with null', (done) => {
      const content = 'apiVersion: null';
      const symbols = parseSetup(content);
      assert.equal(symbols.length, 1);
      done();
    });

    it('Document Symbols with array of strings', (done) => {
      const content = 'items:\n  - test\n  - test';
      const symbols = parseSetup(content);
      assert.equal(symbols.length, 1);
      done();
    });

    it('Document Symbols with array', (done) => {
      const content = 'authors:\n  - name: Josh\n  - email: jp';
      const symbols = parseSetup(content);
      assert.equal(symbols.length, 3);
      done();
    });

    it('Document Symbols with object and array', (done) => {
      const content =
        'scripts:\n  node1: test\n  node2: test\nauthors:\n  - name: Josh\n  - email: jp';
      const symbols = parseSetup(content);
      assert.equal(symbols.length, 6);
      done();
    });

    it('Document Symbols with multi documents', (done) => {
      const content = '---\nanalytics: true\n...\n---\njson: test\n...';
      const symbols = parseSetup(content);
      assert.equal(symbols.length, 2);
      done();
    });
  });
});
