import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { regexSearchFiles } from './ripgrep';

describe('regexSearchFiles', () => {
  const tempDir = path.join(os.tmpdir(), `ripgrep-test-${Date.now()}`);

  // 创建临时测试目录和文件
  beforeAll(async () => {
    // 确保测试目录存在
    await fs.promises.mkdir(tempDir, { recursive: true });

    // 创建测试子目录
    await fs.promises.mkdir(path.join(tempDir, 'src'), { recursive: true });
    await fs.promises.mkdir(path.join(tempDir, 'docs'), { recursive: true });
    await fs.promises.mkdir(path.join(tempDir, 'node_modules'), { recursive: true });

    // 创建包含特定内容的测试文件
    await fs.promises.writeFile(
      path.join(tempDir, 'src', 'app.js'),
      `function main() {
  // TODO: 实现错误处理
  console.log('Hello world');
  // TODO: 添加更多功能
  return 42;
}`
    );

    await fs.promises.writeFile(
      path.join(tempDir, 'src', 'utils.js'),
      `function helper() {
  // FIXME: 这里有性能问题
  let result = 0;
  for (let i = 0; i < 1000; i++) {
    result += i * i;
  }
  // FIXME: 返回值可能溢出
  return result;
}`
    );

    await fs.promises.writeFile(
      path.join(tempDir, 'docs', 'readme.md'),
      `# 项目文档
      
这是一个示例项目。

## TODO
- 完成测试覆盖
- 添加更多文档
- 发布版本 1.0
`
    );

    // 创建 .gitignore 文件
    await fs.promises.writeFile(
      path.join(tempDir, '.gitignore'),
      'node_modules/\n*.log'
    );
  });

  // 清理测试目录
  afterAll(async () => {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`清理测试目录失败: ${err}`);
    }
  });

  it('应该能搜索文件内容并返回格式化的结果', async () => {
    const results = await regexSearchFiles(tempDir, tempDir, 'TODO');

    // 验证结果包含特定文件和内容
    expect(results).toContain('src/app.js');
    expect(results).toContain('实现错误处理');
    expect(results).toContain('添加更多功能');
    expect(results).toContain('docs/readme.md');
    expect(results).toContain('完成测试覆盖');
  });

  it('应该处理不匹配的搜索模式', async () => {
    // 搜索不存在的内容
    const noResults = await regexSearchFiles(tempDir, tempDir, 'NONEXISTENT_STRING_12345');

    expect(noResults).toContain('Found 0 results.');
  });

  it('应该能处理特殊的正则表达式字符', async () => {
    // 创建一个包含特殊正则字符的文件
    await fs.promises.writeFile(
      path.join(tempDir, 'special.txt'),
      `This line has (parentheses) and [brackets].
This line has a * star and a + plus.
This line has a ? question mark.
`
    );

    // 使用包含特殊字符的正则表达式搜索
    const specialResults = await regexSearchFiles(tempDir, tempDir, '\\(.*\\)');

    // 验证特殊字符搜索结果
    expect(specialResults).toContain('special.txt');
    expect(specialResults).toContain('(parentheses)');
  });
});
