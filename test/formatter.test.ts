/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { FormattingOptions, TextDocument } from 'vscode-languageserver';
import { getLanguageService } from '../src/languageservice/yamlLanguageService';
import { schemaRequestService, workspaceContext } from './testHelper';
const assert = require('assert');

const languageService = getLanguageService(
  schemaRequestService,
  workspaceContext,
  []
);

const uri = 'http://json.schemastore.org/bowerrc';
const languageSettings = {
  schemas: [],
  validate: true,
  customTags: [],
};
const fileMatch = ['*.yml', '*.yaml'];
languageSettings.schemas.push({ uri, fileMatch });
languageSettings.customTags.push('!Test');
languageService.configure(languageSettings);

describe('Formatter Tests', () => {
  // Tests for validator
  describe('Formatter', function() {
    function setup(content: string) {
      return TextDocument.create(
        'file://~/Desktop/vscode-k8s/test.yaml',
        'yaml',
        0,
        content
      );
    }

    describe('Test that formatter works with custom tags', function() {
      it('Formatting works without custom tags', () => {
        const content = `cwd: test`;
        const testTextDocument = setup(content);
        const edits = languageService.doFormat(
          testTextDocument,
          {} as FormattingOptions
        );
        assert.notEqual(edits.length, 0);
        assert.equal(edits[0].newText, 'cwd: test\n');
      });

      it('Formatting works with custom tags', () => {
        const content = `cwd:       !Test test`;
        const testTextDocument = setup(content);
        const edits = languageService.doFormat(
          testTextDocument,
          {} as FormattingOptions
        );
        assert.notEqual(edits.length, 0);
      });
    });
  });
});
