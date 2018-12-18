import { ASTNode } from './jsonLanguageTypes';
import { JSONDocument, IProblem } from './parser/jsonParser';
import { getPosition } from './utils/documentPositionCalculator';

export class SingleYAMLDocument extends JSONDocument {
  public lines: number[];
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

  // getNodeFromOffsetEndInclusive(offset: number): ASTNode {
  //   if (!this.root) {
  //     return;
  //   }
  //   if (
  //     offset < this.root.offset ||
  //     offset > this.root.offset + this.root.length
  //   ) {
  //     // We somehow are completely outside the document
  //     // This is unexpected
  //     console.log('Attempting to resolve node outside of document');
  //     return null;
  //   }

  //   function* sliding2(nodes: ASTNode[]) {
  //     for (let i = 0; i < nodes.length; i ++) {
  //       yield [nodes[i], i === nodes.length ? null : nodes[i + 1]];
  //     }
  //   }

  //   const onLaterLine = (offset: number, node: ASTNode) => {
  //     const { line: actualLine } = getPosition(offset, this.lines);
  //     const { line: nodeEndLine } = getPosition(
  //       node.offset + node.length,
  //       this.lines
  //     );

  //     return actualLine > nodeEndLine;
  //   };

  //   let findNode = (nodes: ASTNode[]): ASTNode => {
  //     if (nodes.length === 0) {
  //       return null;
  //     }

  //     const gen = sliding2(nodes);

  //     for (let [first, second] of gen) {
  //       const end = second
  //         ? second.offset
  //         : first.parent.offset + first.parent.length;
  //       if (offset >= first.offset && offset < end) {
  //         const children = first.children;

  //         const foundChild = findNode(children);

  //         if (!foundChild && onLaterLine(offset, first)) {
  //           return this.getNodeByIndent(this.lines, offset, this.root);
  //         }

  //         return foundChild || first;
  //       }
  //     }

  //     return null;
  //   };

  //   return findNode(this.root.children) || this.root;
  // }

  // private getNodeByIndent = (
  //   lines: number[],
  //   offset: number,
  //   node: ASTNode
  // ) => {
  //   const { line, column: indent } = getPosition(offset, this.lines);

  //   const children = node.children;

  //   function findNode(children: ASTNode[]) {
  //     if (children.length > 0) {

  //     }
  //     for (let idx = 0; idx < children.length; idx++) {
  //       const child = children[idx];

  //       const { line: childLine, column: childCol } = getPosition(
  //         child.offset,
  //         lines
  //       );

  //       if (childCol > indent) {
  //         return null;
  //       }

  //       const newChildren = child.children;
  //       const foundNode = findNode(newChildren);

  //       if (foundNode) {
  //         return foundNode;
  //       }

  //       // We have the right indentation, need to return based on line
  //       if (childLine == line) {
  //         return child;
  //       }
  //       if (childLine > line) {
  //         // Get previous
  //         idx - 1 >= 0 ? children[idx - 1] : child;
  //       }
  //       // Else continue loop to try next element
  //     }

  //     // Special case, we found the correct
  //     return children[children.length - 1];
  //   }

  //   return findNode(children) || node;
  // };

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

  constructor(documents: SingleYAMLDocument[]) {
    this.documents = documents;
  }
}
