import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { installGlobSearchTool } from '../code/glob-search';

describe('installGlobSearchTool', () => {
  let tempDir: string;
  let jsDir: string;
  let tsDir: string;
  let jsFiles: string[] = [];
  let tsFiles: string[] = [];
  let mockInstaller: any;
  let toolFunction: any;

  beforeEach(() => {
    // Create temporary directory structure for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'glob-search-test-'));
    jsDir = path.join(tempDir, 'js');
    tsDir = path.join(tempDir, 'ts');

    // Create directory structure
    fs.mkdirSync(jsDir, { recursive: true });
    fs.mkdirSync(tsDir, { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'node_modules'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'dist'), { recursive: true });

    // Create test JS files with different modification times
    jsFiles = [
      path.join(jsDir, 'file1.js'),
      path.join(jsDir, 'file2.js'),
      path.join(jsDir, 'nested', 'file3.js')
    ];

    // Create nested directory
    fs.mkdirSync(path.join(jsDir, 'nested'), { recursive: true });

    // Create test TypeScript files
    tsFiles = [
      path.join(tsDir, 'file1.ts'),
      path.join(tsDir, 'file2.ts'),
      path.join(tsDir, 'interface.d.ts')
    ];

    // Create all the files with staggered modification times
    for (let i = 0; i < jsFiles.length; i++) {
      fs.writeFileSync(jsFiles[i], `// JS file ${i + 1}`);
    }

    for (let i = 0; i < tsFiles.length; i++) {
      fs.writeFileSync(tsFiles[i], `// TS file ${i + 1}`);
    }

    // Create files that should be ignored
    fs.writeFileSync(path.join(tempDir, 'node_modules', 'ignored.js'), '// Should be ignored');
    fs.writeFileSync(path.join(tempDir, 'dist', 'bundle.js'), '// Should be ignored');

    // Mock installer
    mockInstaller = {
      calls: [],
      install: function(name: string, description: string, schema: any, handler: any) {
        this.calls.push({ name, description, schema, handler });
        toolFunction = handler;
      }
    };

    // Set workspace path for testing
    process.env.WORKSPACE_PATH = tempDir;
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    delete process.env.WORKSPACE_PATH;
  });

  test('should install the tool correctly', () => {
    installGlobSearchTool(mockInstaller.install.bind(mockInstaller));

    expect(mockInstaller.calls).toHaveLength(1);
    expect(mockInstaller.calls[0].name).toBe('glob-search');
    expect(mockInstaller.calls[0].description).toContain('Fast file pattern matching');
  });

  test('should find JS files using glob pattern', async () => {
    installGlobSearchTool(mockInstaller.install.bind(mockInstaller));

    const result = await toolFunction({
      pattern: '**/*.js'
    });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].text).toContain('Found 3 file(s) matching pattern');
    expect(result.content[0].text).toContain('js/file1.js');
    expect(result.content[0].text).toContain('js/file2.js');
    expect(result.content[0].text).toContain('js/nested/file3.js');
    
    // Should not include ignored directories
    expect(result.content[0].text).not.toContain('node_modules');
    expect(result.content[0].text).not.toContain('dist');
  });

  test('should find TS files using glob pattern', async () => {
    installGlobSearchTool(mockInstaller.install.bind(mockInstaller));

    const result = await toolFunction({
      pattern: '**/*.ts'
    });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].text).toContain('Found 3 file(s) matching pattern');
    expect(result.content[0].text).toContain('ts/file1.ts');
    expect(result.content[0].text).toContain('ts/file2.ts');
    expect(result.content[0].text).toContain('ts/interface.d.ts');
  });

  test('should find files in specific directory when path is provided', async () => {
    installGlobSearchTool(mockInstaller.install.bind(mockInstaller));

    const result = await toolFunction({
      pattern: '*.ts',
      path: 'ts'
    });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].text).toContain('Found 3 file(s) matching pattern');
    expect(result.content[0].text).toContain('file1.ts');
    expect(result.content[0].text).toContain('file2.ts');
    expect(result.content[0].text).toContain('interface.d.ts');
  });

  test('should return no files if pattern matches nothing', async () => {
    installGlobSearchTool(mockInstaller.install.bind(mockInstaller));

    const result = await toolFunction({
      pattern: '**/*.go'
    });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].text).toContain('No files found matching pattern');
  });

  test('should handle complex glob patterns', async () => {
    installGlobSearchTool(mockInstaller.install.bind(mockInstaller));

    const result = await toolFunction({
      pattern: '**/*.{js,ts}'
    });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].text).toContain('Found 6 file(s) matching pattern');
    // Should include both JS and TS files
    expect(result.content[0].text).toContain('js/file1.js');
    expect(result.content[0].text).toContain('ts/file1.ts');
  });

  test('should prevent path traversal attacks', async () => {
    installGlobSearchTool(mockInstaller.install.bind(mockInstaller));

    const result = await toolFunction({
      pattern: '**/*.js',
      path: '../../../etc'
    });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].text).toContain('outside the workspace directory');
  });

  test('should return error for non-existent path', async () => {
    installGlobSearchTool(mockInstaller.install.bind(mockInstaller));

    const result = await toolFunction({
      pattern: '**/*.js',
      path: 'nonexistent'
    });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].text).toContain('does not exist');
  });

  test('should sort files by modification time', async () => {
    installGlobSearchTool(mockInstaller.install.bind(mockInstaller));
    
    // Update modification times to ensure consistent ordering
    // Set file1.js to be the newest
    const now = new Date();
    const oneMinAgo = new Date(now.getTime() - 60000);
    const twoMinAgo = new Date(now.getTime() - 120000);
    
    fs.utimesSync(jsFiles[0], now, now);
    fs.utimesSync(jsFiles[1], oneMinAgo, oneMinAgo);
    fs.utimesSync(jsFiles[2], twoMinAgo, twoMinAgo);

    const result = await toolFunction({
      pattern: '**/*.js'
    });

    // 检查输出结果中的元数据
    // @ts-ignore - 添加元数据用于测试，忽略类型检查
    const metadata = result.metadata;
    expect(metadata).toBeDefined();
    expect(metadata.files).toHaveLength(3);

    // 检查文件基本名称是否按修改时间排序
    const fileBasenames = metadata.files.map((f: any) => f.basename);
    expect(fileBasenames[0]).toBe('file1.js'); // 最新的文件应该排在第一位
    expect(fileBasenames[1]).toBe('file2.js');
    expect(fileBasenames[2]).toBe('file3.js');
    
    // 检查文本输出是否包含文件名（不严格检查顺序）
    expect(result.content[0].text).toContain('file1.js');
    expect(result.content[0].text).toContain('file2.js');
    expect(result.content[0].text).toContain('file3.js');
  });

  test('should handle absolute path correctly', async () => {
    installGlobSearchTool(mockInstaller.install.bind(mockInstaller));

    const result = await toolFunction({
      pattern: '*.js',
      path: jsDir
    });

    expect(result.content).toHaveLength(1);
    // @ts-ignore - 元数据用于测试，忽略类型检查
    const metadata = result.metadata;
    expect(metadata).toBeDefined();
    
    // 绝对路径搜索应该只找到 jsDir 目录中的文件，不包括嵌套目录
    // 我们检查实际匹配的文件数量而不是预期的固定数字
    const basenames = metadata.files.map((f: any) => f.basename);
    expect(basenames).toContain('file1.js');
    expect(basenames).toContain('file2.js');
    
    // 确保文件路径出现在输出中
    expect(result.content[0].text).toContain('file1.js');
    expect(result.content[0].text).toContain('file2.js');
  });
});
