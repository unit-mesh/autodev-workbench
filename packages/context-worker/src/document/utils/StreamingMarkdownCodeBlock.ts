/**
 * FencedCodeBlock class represents a block of code that is delimited by triple backticks (```) and can optionally have a
 * language identifier.
 *
 * This class is used to parse and represent code blocks within Markdown or other text documents. It provides methods to
 * parse the content of a code block and to retrieve the language identifier and the code itself.
 *
 * @class FencedCodeBlock
 * @param {string} language The language identifier of the code block.
 * @param {string} text The text content of the code block.
 * @param {boolean} isComplete Indicates whether the code block is complete or not.
 */
export class StreamingMarkdownCodeBlock {
  language: string;
  text: string;
  isComplete: boolean;
  startIndex: number = 0;
  endIndex: number = 0;

  constructor(language: string, text: string, isComplete: boolean, startIndex: number = 0, endIndex: number = 0) {
    this.language = language;
    this.text = text;
    this.isComplete = isComplete;

    // for split
    this.startIndex = startIndex;
    this.endIndex = endIndex;
  }

  static parse(content: string, defaultLanguage: string = ""): StreamingMarkdownCodeBlock {
    return StreamingMarkdownCodeBlock.multiLineCodeBlock(content, defaultLanguage);
  }

  static multiLineCodeBlock(content: string, primaryLanguage: string = "") {
    const regex = /```([\w#+]*?)\s*$/;
    const lines = content.replace(/\\n/g, "\n").split("\n");

    let lastBlockStartIndex = 0;
    let codeBlocks: MarkdownCodeBlock[] = [];
    let language = "markdown";
    let blockContent: string[] = [];

    lines.forEach((line, index) => {
      if (line.trim().startsWith("```")) {
        const matchResult = regex.exec(line.trim());
        if (matchResult && matchResult[1] !== "") {
          language = matchResult[1];
          if (blockContent.length > 0) {
            const block = blockContent.join("\n");
            codeBlocks.push(new MarkdownCodeBlock(language, lastBlockStartIndex, index, block));
            blockContent = [];
          }

          lastBlockStartIndex = index;
        } else {
          if (blockContent.length > 0) {
            const block = blockContent.join("\n");
            codeBlocks.push(new MarkdownCodeBlock(language, lastBlockStartIndex, lines.length - 1, block));
          }
        }
      } else {
        blockContent.push(line);
      }
    });

    // split content by code block from last match line to end
    const block = lines.slice(lastBlockStartIndex).join("\n");
    const otherBlock = StreamingMarkdownCodeBlock.singleBlock(block);
    codeBlocks.push(new MarkdownCodeBlock(otherBlock.language, lastBlockStartIndex, lines.length - 1, otherBlock.text));

    // filter by language
    if (primaryLanguage !== "") {
      codeBlocks = codeBlocks.filter(block => block.language === primaryLanguage);
      if (codeBlocks.length > 0) {
        const block = codeBlocks[codeBlocks.length - 1];
        return new StreamingMarkdownCodeBlock(block.language, block.code, false, block.startLine, block.endLine);
      }
    }

    return otherBlock;
  }

  static singleBlock(content: string): StreamingMarkdownCodeBlock {
    const regex = /```([\w#+]*)/;
    // convert content \\n to \n
    const lines = content.replace(/\\n/g, "\n").split("\n");

    let codeStarted = false;
    let codeClosed = false;
    let languageId: string | null = null;
    const codeBuilder: string[] = [];

    for (const line of lines) {
      if (!codeStarted) {
        const matchResult = line.trimStart().match(regex);
        if (matchResult) {
          languageId = matchResult[1];
          codeStarted = true;
        }
      } else if (line.startsWith("```")) {
        codeClosed = true;
        break;
      } else {
        codeBuilder.push(line);
      }
    }

    let startIndex = 0;
    let endIndex = codeBuilder.length - 1;

    while (startIndex <= endIndex) {
      if (!codeBuilder[startIndex].trim()) {
        startIndex++;
      } else {
        break;
      }
    }

    while (endIndex >= startIndex) {
      if (!codeBuilder[endIndex].trim()) {
        endIndex--;
      } else {
        break;
      }
    }

    const trimmedCode = codeBuilder.slice(startIndex, endIndex + 1).join("\n");
    const language = languageId || "plaintext";

    // if content is not empty, but code is empty, then it's a markdown
    if (!trimmedCode.trim()) {
      return new StreamingMarkdownCodeBlock(
        "markdown",
        content.replace(/\\n/g, "\n"),
        codeClosed,
        startIndex,
        endIndex,
      );
    }

    return new StreamingMarkdownCodeBlock(language, trimmedCode, codeClosed, startIndex, endIndex);
  }
}


export class MarkdownCodeBlock {
  language: string;
  startLine: number;
  endLine: number;
  code: string;

  constructor(language: string, startLine: number, endLine: number, code: string) {
    this.language = language;
    this.startLine = startLine;
    this.endLine = endLine;
    this.code = code;
  }

  static from(markdown: string): MarkdownCodeBlock[] {
    const regex = /```(\w+)?\s([\s\S]*?)```/gm;
    const blocks: MarkdownCodeBlock[] = [];
    let match;

    while ((match = regex.exec(markdown)) !== null) {
      const startLine = markdown.substring(0, match.index).split("\n").length;
      const endLine = startLine + match[0].split("\n").length - 1;
      blocks.push(new MarkdownCodeBlock(match[1] || "plaintext", startLine, endLine, match[2]));
    }

    return blocks;
  }
}
