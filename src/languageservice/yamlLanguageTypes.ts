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

	public getNodeFromOffset(offset: number, includeRightBound = false): ASTNode {
		return super.getNodeFromOffset(offset, includeRightBound);
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
