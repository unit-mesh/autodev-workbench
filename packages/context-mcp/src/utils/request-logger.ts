import fs from 'fs';
import path from 'path';
import os from 'os';

// Use a consistent location regardless of where the command is executed
// Options: application directory, user's home directory, or a specific path
const APP_ROOT = path.resolve(__dirname, '../../../..');
const LOG_DIR = path.join(APP_ROOT, 'logs');
// Alternative: const LOG_DIR = path.join(os.homedir(), '.autodev', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'api-requests.log');

// Ensure the log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export interface LogEntry {
  timestamp: string;
  uri: string;
  request: any;
  response: any;
}

/**
 * Logs API request and response data to a file
 */
export function logApiInteraction(uri: string, request: any, response: any): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    uri,
    request,
    response
  };

  const logText = JSON.stringify(entry, null, 2) + ',\n';

  try {
    fs.appendFileSync(LOG_FILE, logText);
    console.log(`API interaction logged to ${LOG_FILE}`);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

/**
 * Reads all logged API interactions
 */
export function readApiLogs(): LogEntry[] {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return [];
    }

    const content = fs.readFileSync(LOG_FILE, 'utf-8');
    // Parse the log content (handling the trailing comma)
    const jsonContent = `[${content.replace(/,\s*$/, '')}]`;
    return JSON.parse(jsonContent);
  } catch (error) {
    console.error('Failed to read log file:', error);
    return [];
  }
}

/**
 * Returns the path to the log file
 */
export function getLogFilePath(): string {
  return LOG_FILE;
}
