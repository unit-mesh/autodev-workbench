import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { listFiles } from './list-files';

describe('listFiles', () => {
  const tempDir = path.join(os.tmpdir(), `listfiles-test-${Date.now()}`);

  // 创建临时测试目录和文件
  beforeAll(async () => {
    // 确保测试目录存在
    await fs.promises.mkdir(tempDir, { recursive: true });

    // 创建测试子目录
    await fs.promises.mkdir(path.join(tempDir, 'subdir1'), { recursive: true });
    await fs.promises.mkdir(path.join(tempDir, 'subdir2'), { recursive: true });
    await fs.promises.mkdir(path.join(tempDir, 'node_modules'), { recursive: true });

    // 创建测试文件
    await fs.promises.writeFile(path.join(tempDir, 'file1.txt'), 'content1');
    await fs.promises.writeFile(path.join(tempDir, 'file2.js'), 'content2');
    await fs.promises.writeFile(path.join(tempDir, 'subdir1', 'subfile1.txt'), 'subcontent1');
    await fs.promises.writeFile(path.join(tempDir, 'subdir2', 'subfile2.js'), 'subcontent2');
    await fs.promises.writeFile(path.join(tempDir, 'node_modules', 'pkgfile.js'), 'pkgcontent');

    // 创建 .gitignore 文件
    await fs.promises.writeFile(path.join(tempDir, '.gitignore'), 'node_modules/\n*.log');
  });

  // 清理测试目录
  afterAll(async () => {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`清理测试目录失败: ${err}`);
    }
  });

  it('应该能正确地列出文件并遵循过滤规则', async () => {
    const [nonRecursiveFiles] = await listFiles(tempDir, false, 100);

    // 应该包含目录文件和子目录
    expect(nonRecursiveFiles).toContain(`${tempDir}/subdir1/`);
    expect(nonRecursiveFiles).toContain(`${tempDir}/subdir2/`);
    expect(nonRecursiveFiles.some(f => f.endsWith('file1.txt'))).toBe(true);
    expect(nonRecursiveFiles.some(f => f.endsWith('file2.js'))).toBe(true);

    // 不应包含子目录中的文件
    expect(nonRecursiveFiles.some(f => f.includes('subfile1.txt'))).toBe(false);

    // node_modules 应该被过滤掉
    expect(nonRecursiveFiles).not.toContain(`${tempDir}/node_modules/`);

    // 递归模式测试
    const [recursiveFiles] = await listFiles(tempDir, true, 100);

    // 应该包含子目录文件
    expect(recursiveFiles.some(f => f.includes('subfile1.txt'))).toBe(true);
    expect(recursiveFiles.some(f => f.includes('subfile2.js'))).toBe(true);

    // node_modules 内容应该被过滤掉
    expect(recursiveFiles.some(f => f.includes('node_modules'))).toBe(false);

    // 测试文件限制
    const limit = 3;
    const [limitedFiles, limitReached] = await listFiles(tempDir, true, limit);

    expect(limitedFiles.length).toBe(limit);
    expect(limitReached).toBe(true);
  });
});
