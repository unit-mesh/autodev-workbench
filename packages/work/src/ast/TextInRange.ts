import { SyntaxNode } from 'web-tree-sitter';

import { Point, TextRange } from '../code-search/scope-graph/model/TextRange';

export class Position {
	readonly line: number;

	readonly character: number;

	constructor(line: number, character: number) {
		this.line = line;
		this.character = character;
	}
}

export class TextInRange {
	text: string;
	startIndex: number;
	endIndex: number;
	start: Position;
	end: Position;

	private constructor(displayName: string = '', start: Position, end: Position, startIndex: number, endIndex: number) {
		this.text = displayName;
		this.startIndex = startIndex;
		this.endIndex = endIndex;
		this.start = start;
		this.end = end;
	}

	static fromNode(id: SyntaxNode) {
		const startPosition = new Position(id.startPosition.row, id.startPosition.column);
		const endPosition = new Position(id.endPosition.row, id.endPosition.column);

		const startIndex = id.startIndex;
		const endIndex = id.endIndex;

		return new TextInRange(id.text, startPosition, endPosition, startIndex, endIndex);
	}

	toTextRange(): TextRange {
		const start = new Point(this.start.line, this.start.character, this.startIndex);
		const end = new Point(this.end.line, this.end.character, this.endIndex);
		return new TextRange(start, end, this.text);
	}
}
