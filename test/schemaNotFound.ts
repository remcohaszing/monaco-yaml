/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { TextDocument } from 'vscode-languageserver';
import { parse as parseYAML } from '../src/languageservice/parser/yamlParser';
import { getLanguageService } from '../src/languageservice/yamlLanguageService';
import { schemaRequestService, workspaceContext } from './testHelper';
const assert = require('assert');

const languageService = getLanguageService(
  schemaRequestService,
  workspaceContext,
  [],
);

const uri = 'SchemaDoesNotExist';
const languageSettings = {
  schemas: [],
  validate: true,
  customTags: [],
};
const fileMatch = ['*.yml', '*.yaml'];
languageSettings.schemas.push({ uri, fileMatch });
languageService.configure(languageSettings);

describe('Validation Tests', () => {
  // Tests for validator
  describe('Validation', function() {
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
      const yDoc = parseYAML(
        testTextDocument.getText(),
        languageSettings.customTags,
      );
      return languageService.doValidation(testTextDocument, yDoc);
    }

    // Validating basic nodes
    describe('Test that validation throws error when schema is not found', function() {
      it('Basic test', (done) => {
        const content = `testing: true`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            assert.NotEqual(result.length, 0);
          })
          .then(done, done);
      });
    });
  });
});
