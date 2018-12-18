import { TextDocument } from 'vscode-languageserver';
import { parse as parseYAML } from '../src/languageservice/parser/yamlParser';

describe('SingleYAMLDocument tests', () => {
  function setup(content: string) {
    return TextDocument.create(
      'file://~/Desktop/vscode-k8s/test.yaml',
      'yaml',
      0,
      content
    );
  }

  describe('getNodeFromOffsetEndInclusive', () => {
    const content = `a :
  b:

    `;
    function parseSetup(offset: number) {
      const yamlDocs = parseYAML(content);

      // Should be one doc only
      expect(yamlDocs.documents.length).toBe(1);
      return yamlDocs.documents[0].getNodeFromOffsetEndInclusive(offset);
    }

    it('0', () => {
      const node = parseSetup(0);
      expect(node.value).toBe('a');
      expect(node.type).toBe('string');
    });

    it('1', () => {
      const node = parseSetup(1);
      expect(node.value).toBe('a');
      expect(node.type).toBe('string');
    });

    it('2', () => {
      const node = parseSetup(2);
      expect(node.type).toBe('property');
    });

    it('6', () => {
      const node = parseSetup(6);
      expect(node.value).toBe('b');
      expect(node.type).toBe('string');
    });

    it('7', () => {
      const node = parseSetup(7);
      expect(node.value).toBe('b');
      expect(node.type).toBe('string');
    });

    it('8', () => {
      const node = parseSetup(8);
      expect(node.value).toBe('b');
      expect(node.type).toBe('string');
    });
  });
});
