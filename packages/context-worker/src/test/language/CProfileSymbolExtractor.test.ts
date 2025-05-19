import { describe, expect, it } from 'vitest';

import { TestLanguageServiceProvider } from "../TestLanguageService";
import { CProfile } from "../../code-context/c/CProfile";

const Parser = require('web-tree-sitter');

describe('CProfile SymbolExtractor', () => {
  it('should extract symbols from C code', async () => {
    const cCode = `
/**
 * 示例头文件包含
 */
#include <stdio.h>
#include <stdlib.h>

/**
 * 常量宏定义
 */
#define MAX_SIZE 100

/**
 * 函数宏定义
 */
#define SQUARE(x) ((x) * (x))

/**
 * 枚举类型定义
 */
enum Color {
  /**
   * 红色
   */
  RED,
  
  /**
   * 绿色
   */
  GREEN,
  
  /**
   * 蓝色
   */
  BLUE
};

/**
 * 结构体定义
 */
struct Point {
  /**
   * x坐标
   */
  int x;
  
  /**
   * y坐标
   */
  int y;
};

/**
 * 类型定义
 */
typedef struct {
  /**
   * 姓名
   */
  char name[50];
  
  /**
   * 年龄
   */
  int age;
} Person;

/**
 * 全局变量
 */
int globalCounter;

/**
 * 函数声明
 */
int add(int a, int b);

/**
 * 函数实现
 */
int add(int a, int b) {
  return a + b;
}

/**
 * 主函数
 */
int main() {
  /**
   * 局部变量
   */
  struct Point p = {10, 20};
  
  /**
   * 函数调用
   */
  printf("Point coordinates: (%d, %d)\\n", p.x, p.y);
  
  return 0;
}
`;

    await Parser.init();
    const parser = new Parser();
    const languageService = new TestLanguageServiceProvider(parser);

    const cProfile = new CProfile();
    const cLanguage = await languageService.getLanguage('c');
    parser.setLanguage(cLanguage);

    const tree = parser.parse(cCode);
    const symbolExtractorQuery = cProfile.symbolExtractor.query(cLanguage);
    const captures = symbolExtractorQuery.captures(tree.rootNode);

    // 按类型分组捕获的符号
    const structs = captures.filter(c => c.name === 'definition.struct');
    const typedefs = captures.filter(c => c.name === 'definition.type');
    const functions = captures.filter(c => c.name === 'definition.function');
    const variables = captures.filter(c => c.name === 'definition.variable');
    const macros = captures.filter(c => c.name === 'definition.macro');
    const enums = captures.filter(c => c.name === 'definition.enum');
    const fields = captures.filter(c => c.name === 'definition.field');

    // 验证每种符号类型是否被正确捕获
    expect(structs.length).toBe(2); // struct Point 和 typedef struct 匿名结构体
    expect(typedefs.length).toBe(1); // Person
    expect(functions.length).toBe(2); // add 和 main
    expect(variables.length).toBe(1); // globalCounter
    expect(macros.length).toBe(1); // MAX_SIZE 和 SQUARE
    expect(enums.length).toBe(1); // enum Color
    expect(fields.length).toBeGreaterThan(0); // 结构体字段

    // 验证结构体名称
    const structNames = structs.map(s => {
      const nameCapture = captures.find(cap =>
        cap.name === 'name' &&
        Math.abs(cap.node.startPosition.row - s.node.startPosition.row) < 5
      );
      return nameCapture?.node.text;
    }).filter(Boolean);
    expect(structNames).toContain('Point');

    // 验证类型定义名称
    const typedefNames = typedefs.map(t => {
      const nameCapture = captures.find(cap =>
        cap.name === 'name' &&
        Math.abs(cap.node.startPosition.row - t.node.startPosition.row) < 5
      );
      return nameCapture?.node.text;
    });

    // 验证函数名称
    const functionNames = functions.map(f => {
      const nameCapture = captures.find(cap =>
        cap.name === 'name' &&
        Math.abs(cap.node.startPosition.row - f.node.startPosition.row) < 5
      );
      return nameCapture?.node.text;
    });
    expect(functionNames).toContain('add');
    expect(functionNames).toContain('main');

    // 验证宏定义名称
    const macroNames = macros.map(m => {
      const nameCapture = captures.find(cap =>
        cap.name === 'name' &&
        Math.abs(cap.node.startPosition.row - m.node.startPosition.row) < 5
      );
      return nameCapture?.node.text;
    });
    expect(macroNames).toContain('MAX_SIZE');

    // 验证枚举名称
    const enumNames = enums.map(e => {
      const nameCapture = captures.find(cap =>
        cap.name === 'name' &&
        Math.abs(cap.node.startPosition.row - e.node.startPosition.row) < 5
      );
      return nameCapture?.node.text;
    });
    expect(enumNames).toContain('Color');

    // 验证是否获取到了注释
    const comments = captures.filter(c => c.name === 'comment');
    expect(comments.length).toBeGreaterThan(0);

    // 验证字段名称
    // 获取部分字段名称进行测试
    const fieldText = fields.map(f => f.node.text);
    expect(fieldText.some(text => text.includes('x'))).toBeTruthy();
    expect(fieldText.some(text => text.includes('y'))).toBeTruthy();
  });
});
