#!/usr/bin/env node

/**
 * DEPRECATED: This script has been moved to bin/analyze-issue.js
 *
 * This is a backward compatibility wrapper.
 * Please use the new binary: autodev-analyze-issue
 *
 * @deprecated Use bin/analyze-issue.js or the autodev-analyze-issue binary instead
 */

console.warn('⚠️  DEPRECATION WARNING: This script has been moved to bin/analyze-issue.js');
console.warn('   Please use the new binary: autodev-analyze-issue');
console.warn('   Or run: node bin/analyze-issue.js');
console.warn('');

// Forward to the new implementation
const { main: newMain } = require('../bin/analyze-issue.js');

// Forward execution to the new binary
if (require.main === module) {
  newMain().catch(console.error);
}
