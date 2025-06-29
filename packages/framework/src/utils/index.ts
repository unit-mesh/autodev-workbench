/**
 * 工具函数
 */

import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 深度合并对象
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      (result as any)[key] = deepMerge((target as any)[key] || {}, source[key] as any);
    } else {
      (result as any)[key] = source[key];
    }
  }

  return result;
}

/**
 * 安全的JSON解析
 */
export function safeJsonParse<T = any>(jsonString: string, defaultValue: T | null = null): T | null {
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * 格式化持续时间
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * 生成唯一ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * 检查文件是否存在
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 确保目录存在
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

/**
 * 安全地读取文件
 */
export async function safeReadFile(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string | null> {
  try {
    return await fs.readFile(filePath, encoding);
  } catch {
    return null;
  }
}

/**
 * 安全地写入文件
 */
export async function safeWriteFile(filePath: string, content: string, encoding: BufferEncoding = 'utf8'): Promise<boolean> {
  try {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, encoding);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

/**
 * 检查是否为代码文件
 */
export function isCodeFile(filePath: string): boolean {
  const codeExtensions = [
    '.js', '.jsx', '.ts', '.tsx',
    '.vue', '.svelte',
    '.py', '.java', '.cpp', '.c',
    '.go', '.rs', '.php',
    '.html', '.css', '.scss', '.sass', '.less',
    '.json', '.yaml', '.yml', '.xml'
  ];
  
  return codeExtensions.includes(getFileExtension(filePath));
}

/**
 * 检查是否为配置文件
 */
export function isConfigFile(filePath: string): boolean {
  const configFiles = [
    'package.json', 'tsconfig.json', 'babel.config.js',
    'webpack.config.js', 'vite.config.js', 'rollup.config.js',
    '.eslintrc.js', '.eslintrc.json', 'prettier.config.js',
    'jest.config.js', 'vitest.config.js'
  ];
  
  const fileName = path.basename(filePath);
  return configFiles.includes(fileName) || fileName.startsWith('.env');
}

/**
 * 清理路径
 */
export function cleanPath(filePath: string): string {
  return path.normalize(filePath).replace(/\\/g, '/');
}

/**
 * 获取相对路径
 */
export function getRelativePath(from: string, to: string): string {
  return cleanPath(path.relative(from, to));
}

/**
 * 限制字符串长度
 */
export function truncateString(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 移除字符串中的ANSI颜色代码
 */
export function stripAnsiColors(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * 解析版本号
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10)
  };
}

/**
 * 比较版本号
 */
export function compareVersions(version1: string, version2: string): number {
  const v1 = parseVersion(version1);
  const v2 = parseVersion(version2);
  
  if (!v1 || !v2) {
    return 0;
  }
  
  if (v1.major !== v2.major) {
    return v1.major - v2.major;
  }
  
  if (v1.minor !== v2.minor) {
    return v1.minor - v2.minor;
  }
  
  return v1.patch - v2.patch;
}

/**
 * 检查版本是否兼容
 */
export function isVersionCompatible(currentVersion: string, targetVersion: string): boolean {
  const current = parseVersion(currentVersion);
  const target = parseVersion(targetVersion);
  
  if (!current || !target) {
    return false;
  }
  
  // 主版本号相同认为兼容
  return current.major === target.major;
}

/**
 * 创建备份文件名
 */
export function createBackupFileName(filePath: string, timestamp?: number): string {
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  const dir = path.dirname(filePath);
  const ts = timestamp || Date.now();
  
  return path.join(dir, `${base}.backup.${ts}${ext}`);
}

/**
 * 计算文件哈希（简化版）
 */
export function simpleHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(36);
}

/**
 * 检查是否为空目录
 */
export async function isEmptyDirectory(dirPath: string): Promise<boolean> {
  try {
    const files = await fs.readdir(dirPath);
    return files.length === 0;
  } catch {
    return true;
  }
}

/**
 * 递归删除空目录
 */
export async function removeEmptyDirectories(dirPath: string): Promise<void> {
  try {
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        await removeEmptyDirectories(fullPath);
      }
    }
    
    if (await isEmptyDirectory(dirPath)) {
      await fs.rmdir(dirPath);
    }
  } catch {
    // 忽略错误
  }
}

/**
 * 获取环境变量，支持默认值
 */
export function getEnvVar(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

/**
 * 检查是否为开发环境
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * 创建进度条字符串
 */
export function createProgressBar(progress: number, width: number = 20): string {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  
  return `[${'█'.repeat(filled)}${' '.repeat(empty)}] ${progress.toFixed(1)}%`;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      func(...args);
    }
  };
}
