import TurndownService from "turndown";
import * as cheerio from "cheerio";

export function extractTitle(html: string): string {
	const $ = cheerio.load(html);
	const title = $('title').text().trim();
	return title || 'Untitled';
}

export function isHtml(content: string): boolean {
	try {
		// Check for common HTML markers
		if (content.trim().match(/^<!DOCTYPE|^<html|^<!DOCTYPE/i)) {
			return true;
		}

		// Use cheerio to detect HTML structure
		const $ = cheerio.load(content);
		const hasHtmlElements = $('html').length > 0 || $('body').length > 0 || $('head').length > 0;

		// Check for common HTML tags
		const hasCommonTags = $('div, p, span, a, h1, h2, h3, ul, ol, table').length > 0;

		return hasHtmlElements || hasCommonTags;
	} catch {
		return false;
	}
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
