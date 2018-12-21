import { TextDocument } from 'vscode-languageserver';
import { parse as parseYAML } from '../src/languageservice/parser/yamlParser';

describe('SingleYAMLDocument tests', () => {
  function setup(content: string) {
    return (offset: number) => {
      const yamlDocs = parseYAML(content);

      // Should be one doc only
      expect(yamlDocs.documents.length).toBe(1);
      return yamlDocs.documents[0].getCompletionNodeFromOffset(offset);
    };
  }

  describe('getCompletionNodeFromOffset for simple null value mapping', () => {
    const content = 'a :  \n   ';
    const parseSetup = setup(content);
    it('within value of `a`', () => {
      const node = parseSetup(1);
      expect(node.value).toBe('a');
      expect(node.type).toBe('string');
    });
  });
});
