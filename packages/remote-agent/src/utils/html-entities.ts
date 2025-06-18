/**
 * Utility functions for handling HTML entity encoding/decoding
 */

/**
 * Decode HTML entities in the content
 * This is particularly useful for fixing XML/HTML entity escaping issues
 * that can occur during MCP tool parameter transmission
 */
export function decodeHtmlEntities(content: string): string {
  return content
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=')
    .replace(/&equals;/g, '=')
    .replace(/&apos;/g, "'");
}

/**
 * Encode HTML entities in the content
 * This is the reverse operation of decodeHtmlEntities
 */
export function encodeHtmlEntities(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Check if content contains HTML entities that need decoding
 */
export function hasHtmlEntities(content: string): boolean {
  return /&(?:lt|gt|amp|quot|#39|#x27|#x2F|#x60|#x3D|equals|apos);/.test(content);
}
