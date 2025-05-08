import * as fs from 'fs';
import * as path from 'path';

/**
 * 加载.scm文件内容
 * @param relativePath 相对于调用位置的路径
 * @returns .scm文件的内容字符串
 */
export function loadScmFile(relativePath: string): string {
  try {
    const fullPath = path.resolve(__dirname, relativePath);
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (error) {
    console.error(`Error loading SCM file: ${relativePath}`, error);
    return '';
  }
}
