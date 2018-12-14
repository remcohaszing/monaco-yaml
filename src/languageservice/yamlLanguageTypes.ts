import { JSONDocument } from './parser/jsonParser';
import { ASTNode } from './jsonLanguageTypes';

export class SingleYAMLDocument extends JSONDocument {
  public lines;
  public errors;
  public warnings;

  constructor(lines: number[]) {
    super(null, []);
    this.lines = lines;
    this.errors = [];
    this.warnings = [];
  }

  public getSchemas(schema, doc, node) {
    let matchingSchemas = [];
    doc.validate(schema, matchingSchemas, node.start);
    return matchingSchemas;
  }

  public getNodeFromOffset(offset: number): ASTNode {
    return super.getNodeFromOffset(offset, true);
  }

  public getNodeFromOffsetEndInclusive(offset: number): ASTNode {
    let collector: ASTNode[] = [];
    let findNode = (node: ASTNode): ASTNode => {
      if (offset >= node.offset && offset <= node.offset + node.length) {
        let children = node.children;
        for (let i = 0; i < children.length && children[i].offset <= offset; i++) {
          let item = findNode(children[i]);
          if (item) {
            collector.push(item);
          }
        }
        return node;
      }
      return null;
    };
    let foundNode = findNode(this.root);
    let currMinDist = Number.MAX_VALUE;
    let currMinNode = null;
    for (let possibleNode in collector) {
      let currNode = collector[possibleNode];
      let minDist = (currNode.offset + currNode.length - offset) + (offset - currNode.offset);
      if (minDist < currMinDist) {
        currMinNode = currNode;
        currMinDist = minDist;
      }
    }
    return currMinNode || foundNode;
  }
}

export class YAMLDocument {
  public documents: SingleYAMLDocument[]
  public errors;
  public warnings;

  constructor(documents: SingleYAMLDocument[]) {
    this.documents = documents;
    this.errors = [];
    this.warnings = [];
  }
}
