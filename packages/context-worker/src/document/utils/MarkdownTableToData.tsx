import { remark } from "remark";
import remarkGfm from "remark-gfm";

export async function markdownTableToData(markdown: string): Promise<any[][]> {
  const tree = remark().use(remarkGfm).parse(markdown);

  const tables = [];

  for (const node of tree.children) {
    if (node.type === "table") {
      const tableData = [];

      const headers = node.children[0].children.map(cell => {
        return extractTextFromCell(cell);
      });

      for (let i = 1; i < node.children.length; i++) {
        const row = node.children[i];
        const rowData: any = {};
        for (let j = 0; j < row.children.length; j++) {
          const cell = row.children[j];
          rowData[headers[j]] = extractTextFromCell(cell);
        }
        tableData.push(rowData);
      }

      tables.push(tableData);
    }
  }

  return tables;
}

export function tableDataToMarkdown(data: any[]) {
  let markdown = "";

  if (data.length === 0) {
    return markdown;
  }

  const headers = Object.keys(data[0]);
  markdown += "| " + headers.join(" | ") + " |\n";
  markdown += "| " + headers.map(() => "---").join(" | ") + " |\n";

  for (const row of data) {
    markdown += "| " + headers.map(header => row[header] || "").join(" | ") + " |\n";
  }

  return markdown;
}

function extractTextFromCell(cell: any) {
  let text = "";
  for (const node of cell.children) {
    if (node.type === "text") {
      text += node.value;
    } else if (node.children) {
      text += extractTextFromCell(node);
    }
  }
  return text.trim();
}
