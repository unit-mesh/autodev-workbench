import TurndownService from "turndown";
import * as cheerio from "cheerio";

export function extractTitle(html: string): string {
	const $ = cheerio.load(html);
	const title = $('title').text().trim();
	return title || 'Untitled';
}

export async function urlToMarkdown(html: string): Promise<string> {
	const $ = cheerio.load(html);
	$("script, style, nav, footer, header").remove();

	const turndownService = new TurndownService({
		headingStyle: 'atx',
		hr: '---',
		bulletListMarker: '-',
		codeBlockStyle: 'fenced',
		fence: '```',
		emDelimiter: '*',
		strongDelimiter: '**',
		linkStyle: 'inlined',
		linkReferenceStyle: 'full'
	});

	turndownService.addRule('removeComments', {
		filter: function (node: any) {
			return node.nodeType === 8; // Comment node
		},
		replacement: function () {
			return '';
		}
	});

	const markdown = turndownService.turndown($.html());

	return markdown
		.replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
		.replace(/^\s+|\s+$/g, '') // Trim
		.replace(/\s+$/gm, ''); // Remove trailing spaces from lines
}
