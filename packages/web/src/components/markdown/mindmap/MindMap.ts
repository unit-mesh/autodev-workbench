import * as xmlbuilder from "xmlbuilder";
import { v4 as uuidv4 } from "uuid"; // For ID generation
import { parseStringPromise } from "xml2js";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import { MindNode } from "../mindmap/MindNode";

export class MindMap {
  title: string;
  nodes: MindNode[];

  constructor(title: string, nodes: MindNode[] = []) {
    this.title = title;
    this.nodes = nodes;
  }

  toXML(): string {
    const root = xmlbuilder.create("map").att("version", "1.0.0");
    const rootNode = root.ele("node", { ID: uuidv4(), TEXT: this.title });

    this.nodes.forEach(node => {
      node.appendToXML(rootNode);
    });

    let result = root.end({ pretty: true });
    result = result.replace(/<\?xml version="1.0"\?>\n/, "");
    return result;
  }

  static fromXML(xml: string): Promise<MindMap> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return parseStringPromise(xml).then((result: any) => {
      const rootNode = result.map.node[0];
      const title = rootNode.$.TEXT;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodes = (rootNode.node || []).map((nodeObj: any) => MindNode.fromXML(nodeObj));

      return new MindMap(title, nodes);
    });
  }

  static fromMarkdownHeader(markdown: string): MindMap {
    const tree = unified().use(remarkParse).parse(markdown);
    const nodes: MindNode[] = [];
    const lastNodeAtLevel: { [key: number]: MindNode } = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    visit(tree, "heading", (node: any) => {
      const depth = node.depth;
      const text = node.children
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((child: any) => child.type === 'text')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((child: any) => child.value)
        .join(" ");

      const newNode: MindNode = new MindNode(uuidv4(), text);

      if (depth === 1) {
        nodes.push(newNode);
        lastNodeAtLevel[1] = newNode;
      } else {
        const parentNode = lastNodeAtLevel[depth - 1];
        if (parentNode) {
          parentNode.children.push(newNode);
        }
        lastNodeAtLevel[depth] = newNode;
      }
    });

    return new MindMap("Markdown Map", nodes);
  }

  static fromPlantUML(plantUML: string): MindMap {
    const lines = plantUML
      .split("\n")
      .map(line => line.trim())
      .filter(line => line && !line.startsWith("@"));  // Filter out empty lines and directives

    const titleLine = lines[0];
    const title = titleLine ? titleLine.replace(/^\*+|\++/, "").trim() : "Untitled";

    const nodes = MindNode.fromPlantUML(lines);
    return new MindMap(title, nodes);
  }

  toPlantUML(): string {
    let plantUML = `@startmindmap\n* ${this.title}\n`;
    this.nodes.forEach(node => {
      plantUML += node.toPlantUML(1);
    });
    plantUML += "@endmindmap";
    return plantUML;
  }
}
