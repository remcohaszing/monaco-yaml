import { ASTNode } from './jsonLanguageTypes';
import { JSONDocument, IProblem } from './parser/jsonParser';

export class SingleYAMLDocument extends JSONDocument {
  public lines;
  public errors: IProblem[];
  public warnings: IProblem[];

  constructor(lines: number[]) {
    super(null, []);
    this.lines = lines;
    this.errors = [];
    this.warnings = [];
  }

  public getSchemas(schema, doc, node) {
    const matchingSchemas = [];
    doc.validate(schema, matchingSchemas, node.start);
    return matchingSchemas;
  }

  public getNodeFromOffset(offset: number): ASTNode {
    return super.getNodeFromOffset(offset, true);
  }

  public getNodeFromOffsetEndInclusive(offset: number): ASTNode {
    const collector: ASTNode[] = [];
    const findNode = (node: ASTNode): ASTNode => {
      if (offset >= node.offset && offset <= node.offset + node.length) {
        const children = node.children;
        for (
          let i = 0;
          i < children.length && children[i].offset <= offset;
          i++
        ) {
          const item = findNode(children[i]);
          if (item) {
            collector.push(item);
          }
        }
        return node;
      }
      return null;
    };
    const foundNode = findNode(this.root);
    let currMinDist = Number.MAX_VALUE;
    let currMinNode = null;
    for (const possibleNode in collector) {
      const currNode = collector[possibleNode];
      const minDist =
        currNode.offset + currNode.length - offset + (offset - currNode.offset);
      if (minDist < currMinDist) {
        currMinNode = currNode;
        currMinDist = minDist;
      }
    }
    return currMinNode || foundNode;
  }
}

export class YAMLDocument {
  public documents: SingleYAMLDocument[];
  public errors;
  public warnings;

  constructor(documents: SingleYAMLDocument[]) {
    this.documents = documents;
    this.errors = [];
    this.warnings = [];
  }
}
