import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import * as os from 'os';

interface Logger {
  debug(message: string, error?: Error): void;
}

const LOG: Logger = {
  debug(message: string, error?: Error): void {
    console.debug(message, error);
  }
};

/**
 * Finds the ripgrep binary on the system.
 * @returns The path to the ripgrep binary, or undefined if not found.
 */
export function findRipgrepBinary(): string | undefined {
  const osName = os.platform().toLowerCase();
  const binName = osName === 'win32' ? 'rg.exe' : 'rg';

  if (osName === 'win32') {
    return findRipgrepBinaryOnWindows(binName);
  } else {
    return findRipgrepBinaryOnUnix(binName);
  }
}

/**
 * Finds the ripgrep binary on Windows.
 * @param binName The binary name (rg.exe)
 * @returns The path to the ripgrep binary, or null if not found.
 */
function findRipgrepBinaryOnWindows(binName: string): string | undefined {
  try {
    const process = childProcess.spawnSync('where', [binName], { timeout: 1000 });
    if (process.status === 0 && process.stdout) {
      const path = process.stdout.toString('utf-8')
        .split('\n')
        .find(line => line.trim().length > 0);
      if (path) {
        return path.trim();
      }
    }
  } catch (e) {
    LOG.debug("Failed to locate rg using 'where' command", e instanceof Error ? e : new Error(String(e)));
  }

  // Check common installation locations on Windows
  const commonPaths = [
    path.join(process.env.ProgramFiles || '', 'ripgrep', binName),
    path.join(process.env['ProgramFiles(x86)'] || '', 'ripgrep', binName),
    path.join(process.env.USERPROFILE || '', '.cargo', 'bin', binName)
  ];

  for (const pathItem of commonPaths) {
    if (fs.existsSync(pathItem)) {
      return pathItem;
    }
  }

  return findInPath(binName);
}

/**
 * Finds the ripgrep binary on Unix-like systems.
 * @param binName The binary name (rg)
 * @returns The path to the ripgrep binary, or undefined if not found.
 */
function findRipgrepBinaryOnUnix(binName: string): string | undefined {
  // Check macOS specific location
  if (os.platform() === 'darwin') {
    const macPath = '/usr/local/bin/rg';
    if (fs.existsSync(macPath)) {
      return macPath;
    }
  }

  try {
    const process = childProcess.spawnSync('which', [binName], { timeout: 1000 });
    if (process.status === 0 && process.stdout) {
      const path = process.stdout.toString('utf-8').trim();
      return path;
    }
  } catch (e) {
    LOG.debug("Failed to locate rg using 'which' command", e instanceof Error ? e : new Error(String(e)));
  }

  return findInPath(binName);
}

/**
 * Finds an executable in the PATH.
 * @param executable The executable name
 * @returns The path to the executable, or undefined if not found.
 */
function findInPath(executable: string): string | undefined {
  const pathEnv = process.env.PATH;
  if (!pathEnv) return undefined;

  const pathSeparator = os.platform() === 'win32' ? ';' : ':';

  for (const dir of pathEnv.split(pathSeparator)) {
    const fullPath = path.join(dir, executable);
    try {
      const stat = fs.statSync(fullPath);
      // Check if file exists and is executable (on Unix)
      if (stat.isFile() && (os.platform() === 'win32' || (stat.mode & 0o111))) {
        return fullPath;
      }
    } catch (e) {
      // File doesn't exist or isn't accessible, continue to next directory
    }
  }

  return undefined;
}
