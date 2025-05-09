import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

interface CodeDocument {
	title: string;
	language: string;
	lastTitle: string; /// the heading title before the code block
	beforeString: string; /// x lines before the code block
	afterString: string;  /// x lines after the code block
	code: string;
}

interface DocumentAnalyser {
	parse(markdown: string): Promise<CodeDocument[]>;
}

class DocumentAnalyser {
}


/**
 * 1. get all markdown files
 * 2. parse markdown files to collect code fence block(```) and file in code(`)
 *    - if code (`) is path, get the file content by search in path, replace `/` by os.path.sep
 *    - if code block collect it
 * 3. parse code to get code structure
 */
class MarkdownAnalyser extends DocumentAnalyser {

}
