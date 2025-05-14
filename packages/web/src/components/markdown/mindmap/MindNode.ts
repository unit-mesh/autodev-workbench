import { v4 as uuidv4 } from "uuid";

export class MindNode {
	id: string;
	text: string;
	style: string;
	position: string | null;
	children: MindNode[];
	done: boolean | null;

	constructor(id = uuidv4(), text: string, style: string = "fork", position: string | null = null, subNodes: MindNode[] = [], done: boolean | null = null) {
		this.id = id;  // Automatically generate unique ID
		this.text = text;
		this.style = style;
		this.position = position;
		this.children = subNodes;
		this.done = done;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	appendToXML(parentElement: any): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const attributes: any = {
			ID: this.id,
			TEXT: this.text,
			STYLE: this.style,
		};

		if (this.position) {
			attributes.POSITION = this.position;
		}

		const nodeElement = parentElement.ele("node", attributes);

		this.children.forEach(subNode => {
			subNode.appendToXML(nodeElement);
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static fromXML(nodeObj: any): MindNode {
		const text = nodeObj.$.TEXT;
		const style = nodeObj.$.STYLE || "fork";
		const position = nodeObj.$.POSITION || null;
		const id = nodeObj.$.ID;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const subNodes = (nodeObj.node || []).map((subNode: any) => MindNode.fromXML(subNode));
		return new MindNode(id, text, style, position, subNodes);
	}

	static fromPlantUML(lines: string[], currentIndentLevel = 1): MindNode[] {
		const nodes: MindNode[] = [];
		let index = 0;

		function parseNodes(currentLevel: number): MindNode[] {
			const result: MindNode[] = [];
			while (index < lines.length) {
				const line = lines[index];
				const match = line.match(/^([+*]{1,})\s*(.*)$/);

				if (!match) {
					index++;
					continue;
				}
				const indent = match[1].length;
				const text = match[2];

				if (indent === currentLevel) {
					// Create a new node
					const node = new MindNode(uuidv4(), text);
					result.push(node);
					index++;
					// Check if next line(s) are subNodes
					if (index < lines.length) {
						const nextLine = lines[index];
						const nextMatch = nextLine.match(/^([+*]{1,})\s*(.*)$/);
						if (nextMatch) {
							const nextIndent = nextMatch[1].length;
							if (nextIndent > currentLevel) {
								node.children = parseNodes(nextIndent);
							}
						}
					}
				} else if (indent < currentLevel) {
					// Return to higher level
					break;
				} else if (indent > currentLevel) {
					// Should not happen, but skip the line to avoid infinite loop
					index++;
				}
			}
			return result;
		}

		nodes.push(...parseNodes(currentIndentLevel));

		return nodes;
	}

	toPlantUML(depth: number = 0): string {
		const indent = "  ".repeat(depth);
		let plantUML = `${indent}* ${this.text}\n`;

		this.children.forEach(subNode => {
			plantUML += subNode.toPlantUML(depth + 1);
		});

		return plantUML;
	}
}
