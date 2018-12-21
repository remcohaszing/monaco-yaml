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
languageSettings.customTags.push('!Ref sequence');
languageService.configure(languageSettings);

describe('Validation Tests', () => {
  // Tests for validator
  describe('Validation', function() {
    function setup(content: string) {
      return TextDocument.create(
        'file://~/Desktop/vscode-k8s/test.yaml',
        'yaml',
        0,
        content
      );
    }

    function parseSetup(content: string) {
      const testTextDocument = setup(content);
      const yDoc = parseYAML(
        testTextDocument.getText(),
        languageSettings.customTags
      );
      return languageService.doValidation(testTextDocument, yDoc);
    }

    // Validating basic nodes
    describe('Test that validation does not throw errors', function() {
      it('Basic test', done => {
        const content = `analytics: true`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            expect(result.length).toEqual(0);
          })
          .then(done, done);
      });

      it('Test that boolean value in quotations is not interpreted as boolean i.e. it errors', done => {
        const content = `analytics: "no"`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            assert.notEqual(result.length, 0);
          })
          .then(done, done);
      });

      it('Test that boolean value without quotations is valid', done => {
        const content = `analytics: no`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            expect(result.length).toEqual(0);
          })
          .then(done, done);
      });

      it('Test that boolean is valid when inside strings', done => {
        const content = `cwd: "no"`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            expect(result.length).toEqual(0);
          })
          .then(done, done);
      });

      it('Test that boolean is invalid when no strings present and schema wants string', done => {
        const content = `cwd: no`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            assert.notEqual(result.length, 0);
          })
          .then(done, done);
      });

      it('Basic test', done => {
        const content = `analytics: true`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            expect(result.length).toEqual(0);
          })
          .then(done, done);
      });

      it('Basic test on nodes with children', done => {
        const content = `scripts:\n  preinstall: test1\n  postinstall: test2`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            expect(result.length).toEqual(0);
          })
          .then(done, done);
      });

      it('Advanced test on nodes with children', done => {
        const content = `analytics: true\ncwd: this\nscripts:\n  preinstall: test1\n  postinstall: test2`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            expect(result.length).toEqual(0);
          })
          .then(done, done);
      });

      it('Type string validates under children', done => {
        const content = `registry:\n  register: http://test_url.com`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            expect(result.length).toEqual(0);
          })
          .then(done, done);
      });

      it('Include with value should not error', done => {
        const content = `customize: !include customize.yaml`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            expect(result.length).toEqual(0);
          })
          .then(done, done);
      });

      it('Null scalar value should be treated as null', done => {
        const content = `cwd: Null`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            expect(result.length).toEqual(1);
          })
          .then(done, done);
      });

      it('Anchor should not not error', done => {
        const content = `default: &DEFAULT\n  name: Anchor\nanchor_test:\n  <<: *DEFAULT`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            expect(result.length).toEqual(0);
          })
          .then(done, done);
      });

      it('Anchor with multiple references should not not error', done => {
        const content = `default: &DEFAULT\n  name: Anchor\nanchor_test:\n  <<: *DEFAULT\nanchor_test2:\n  <<: *DEFAULT`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            expect(result.length).toEqual(0);
          })
          .then(done, done);
      });

      it('Multiple Anchor in array of references should not not error', done => {
        const content = `default: &DEFAULT\n  name: Anchor\ncustomname: &CUSTOMNAME\n  custom_name: Anchor\nanchor_test:\n  <<: [*DEFAULT, *CUSTOMNAME]`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            expect(result.length).toEqual(0);
          })
          .then(done, done);
      });

      it('Multiple Anchors being referenced in same level at same time', done => {
        const content = `
        default: &DEFAULT
          name: Anchor
        customname: &CUSTOMNAME
          custom_name: Anchor
        anchor_test:
          <<: *DEFAULT
          <<: *CUSTOMNAME
        `;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            expect(result.length).toEqual(0);
          })
          .then(done, done);
      });

      it('Custom Tags without type', done => {
        const content = `analytics: !Test false`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            expect(result.length).toEqual(0);
          })
          .then(done, done);
      });

      it('Custom Tags with type', done => {
        const content = `resolvers: !Ref\n  - test`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            expect(result.length).toEqual(0);
          })
          .then(done, done);
      });

      describe('Type tests', function() {
        it('Type String does not error on valid node', done => {
          const content = `cwd: this`;
          const validator = parseSetup(content);
          validator
            .then(function(result) {
              expect(result.length).toEqual(0);
            })
            .then(done, done);
        });

        it('Type Boolean does not error on valid node', done => {
          const content = `analytics: true`;
          const validator = parseSetup(content);
          validator
            .then(function(result) {
              expect(result.length).toEqual(0);
            })
            .then(done, done);
        });

        it('Type Number does not error on valid node', done => {
          const content = `timeout: 60000`;
          const validator = parseSetup(content);
          validator
            .then(function(result) {
              expect(result.length).toEqual(0);
            })
            .then(done, done);
        });

        it('Type Object does not error on valid node', done => {
          const content = `registry:\n  search: http://test_url.com`;
          const validator = parseSetup(content);
          validator
            .then(function(result) {
              expect(result.length).toEqual(0);
            })
            .then(done, done);
        });

        it('Type Array does not error on valid node', done => {
          const content = `resolvers:\n  - test\n  - test\n  - test`;
          const validator = parseSetup(content);
          validator
            .then(function(result) {
              expect(result.length).toEqual(0);
            })
            .then(done, done);
        });

        it('Do not error when there are multiple types in schema and theyre valid', done => {
          const content = `license: MIT`;
          const validator = parseSetup(content);
          validator.then(function(result) {
            expect(result.length).toEqual(0);
          });
          done();
        });
      });
    });

    describe('Test that validation DOES throw errors', function() {
      it('Error when theres a finished untyped item', done => {
        const content = `cwd: hello\nan`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            assert.notEqual(result.length, 0);
          })
          .then(done, done);
      });

      it('Error when theres no value for a node', done => {
        const content = `cwd:`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            assert.notEqual(result.length, 0);
          })
          .then(done, done);
      });

      it('Error on incorrect value type (number)', done => {
        const content = `cwd: 100000`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            assert.notEqual(result.length, 0);
          })
          .then(done, done);
      });

      it('Error on incorrect value type (boolean)', done => {
        const content = `cwd: False`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            assert.notEqual(result.length, 0);
          })
          .then(done, done);
      });

      it('Error on incorrect value type (string)', done => {
        const content = `analytics: hello`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            assert.notEqual(result.length, 0);
          })
          .then(done, done);
      });

      it('Error on incorrect value type (object)', done => {
        const content = `scripts: test`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            assert.notEqual(result.length, 0);
          })
          .then(done, done);
      });

      it('Error on incorrect value type (array)', done => {
        const content = `resolvers: test`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            assert.notEqual(result.length, 0);
          })
          .then(done, done);
      });

      it('Include without value should error', done => {
        const content = `customize: !include`;
        const validator = parseSetup(content);
        validator
          .then(function(result) {
            expect(result.length).toEqual(1);
          })
          .then(done, done);
      });
    });
  });
});
