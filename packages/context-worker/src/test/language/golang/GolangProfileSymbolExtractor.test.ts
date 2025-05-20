import { describe, expect, it } from 'vitest';

import { TestLanguageServiceProvider } from "../../TestLanguageService";
import { GolangProfile } from "../../../code-context/go/GolangProfile";

const Parser = require('web-tree-sitter');

describe('GolangProfile SymbolExtractor', () => {
  it('should extract symbols from Go code', async () => {
    const goCode = `
/**
 * 示例包注释
 */
package example

import (
	"fmt"
	"strings"
)

/**
 * 示例接口
 */
type Greeter interface {
	/**
	 * 接口方法
	 */
	Greet(name string) string
}

/**
 * 示例结构体
 */
type Person struct {
	/**
	 * 姓名字段
	 */
	Name string
	
	/**
	 * 年龄字段
	 */
	Age int
}

/**
 * Person的方法实现
 */
func (p *Person) Greet(name string) string {
	return fmt.Sprintf("Hello, %s! My name is %s", name, p.Name)
}

/**
 * 独立函数
 */
func SayHello(name string) string {
	return "Hello, " + name
}
`;

    await Parser.init();
    const parser = new Parser();
    const languageService = new TestLanguageServiceProvider(parser);

    const goProfile = new GolangProfile();
    const goLanguage = await languageService.getLanguage('go');
    parser.setLanguage(goLanguage);

    const tree = parser.parse(goCode);
    const symbolExtractorQuery = goProfile.symbolExtractor.query(goLanguage);
    const captures = symbolExtractorQuery.captures(tree.rootNode);

    // 按类型分组捕获的符号
    const structs = captures.filter(c => c.name === 'definition.struct');
    const interfaces = captures.filter(c => c.name === 'definition.interface');
    const functions = captures.filter(c => c.name === 'definition.function');
    const fields = captures.filter(c => c.name === 'definition.field');

    // 验证每种符号类型是否被正确捕获
    expect(structs.length).toBe(1);
    expect(interfaces.length).toBe(1);
    expect(functions.length).toBe(2); // Greet方法和SayHello函数
    expect(fields.length).toBe(2);  // Name和Age字段

    // 验证结构体名称
    const structNames = structs.map(s => {
      const nameCapture = captures.find(cap =>
        cap.name === 'name' &&
        Math.abs(cap.node.startPosition.row - s.node.startPosition.row) < 5
      );
      return nameCapture?.node.text;
    });
    expect(structNames).toContain('Person');

    // 验证接口名称
    const interfaceNames = interfaces.map(i => {
      const nameCapture = captures.find(cap =>
        cap.name === 'name' &&
        Math.abs(cap.node.startPosition.row - i.node.startPosition.row) < 5
      );
      return nameCapture?.node.text;
    });
    expect(interfaceNames).toContain('Greeter');

    // 验证方法名称
    const methodNames = functions.map(m => {
      const nameCapture = captures.find(cap =>
        cap.name === 'name' &&
        Math.abs(cap.node.startPosition.row - m.node.startPosition.row) < 5
      );
      return nameCapture?.node.text;
    });
    expect(methodNames).toContain('Greet');
    expect(methodNames).toContain('SayHello');

    // 验证字段名称
    const fieldNames = fields.map(f => {
      const nameCapture = captures.find(cap =>
        cap.name === 'name' &&
        Math.abs(cap.node.startPosition.row - f.node.startPosition.row) < 5
      );
      return nameCapture?.node.text;
    });
    expect(fieldNames).toEqual(['Person', 'Age'])

    // 验证是否获取到了注释
    const comments = captures.filter(c => c.name === 'comment');
    expect(comments.length).toBeGreaterThan(0);

    // 验证接收器和方法的关系
    const methodWithReceiver = functions.find(m => {
      const nameCapture = captures.find(cap =>
        cap.name === 'name' &&
        Math.abs(cap.node.startPosition.row - m.node.startPosition.row) < 5 &&
        cap.node.text === 'Greet'
      );
      return nameCapture !== undefined;
    });

    expect(methodWithReceiver).toBeDefined();
    const receiverCapture = captures.find(cap =>
      cap.name === 'receiver' &&
      Math.abs(cap.node.startPosition.row - methodWithReceiver!.node.startPosition.row) < 5
    );
    expect(receiverCapture?.node.text).toContain('Person');
  });
});
