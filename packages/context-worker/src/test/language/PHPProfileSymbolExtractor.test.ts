import { describe, expect, it } from 'vitest';

import { TestLanguageServiceProvider } from "../TestLanguageService";
import { PHPProfile } from "../../code-context/php/PHPProfile";

const Parser = require('web-tree-sitter');

describe('PHPProfile SymbolExtractor', () => {
  it('should extract symbols from PHP code', async () => {
    const phpCode = `<?php
/**
 * 这是示例命名空间
 */
namespace App\\Example;

/**
 * 示例接口
 */
interface DemoInterface {
    /**
     * 接口方法
     */
    public function interfaceMethod(string $param): void;
}

/**
 * 示例特征
 */
trait DemoTrait {
    /**
     * 特征中的方法
     */
    public function traitMethod() {
        echo "Hello from trait";
    }
}

/**
 * 示例类
 */
class DemoClass implements DemoInterface {
    /**
     * 类常量
     */
    const DEMO_CONSTANT = "demo value";
    
    /**
     * 类属性
     */
    private $demoProperty;
    
    /**
     * 类方法
     */
    public function interfaceMethod(string $param): void {
        echo "Hello " . $param;
    }
}

/**
 * 示例函数
 */
function demoFunction($arg) {
    return $arg;
}
?>`;

    await Parser.init();
    const parser = new Parser();
    const languageService = new TestLanguageServiceProvider(parser);
    
    const phpProfile = new PHPProfile();
    const phpLanguage = await languageService.getLanguage('php');
    parser.setLanguage(phpLanguage);
    
    const tree = parser.parse(phpCode);
    const symbolExtractorQuery = phpProfile.symbolExtractor.query(phpLanguage);
    const captures = symbolExtractorQuery.captures(tree.rootNode);
    
    // 按类型分组捕获的符号
    const classes = captures.filter(c => c.name === 'definition.class');
    const methods = captures.filter(c => c.name === 'definition.method');
    const fields = captures.filter(c => c.name === 'definition.field');
    const interfaces = captures.filter(c => c.name === 'definition.interface');
    const traits = captures.filter(c => c.name === 'definition.trait');
    const functions = captures.filter(c => c.name === 'definition.function');
    const constants = captures.filter(c => c.name === 'definition.constant');
    
    // 验证每种符号类型是否被正确捕获
    expect(classes.length).toBe(1);
    expect(methods.length).toBe(2); // trait方法和类方法
    expect(fields.length).toBe(1);
    expect(interfaces.length).toBe(1);
    expect(traits.length).toBe(1);
    expect(functions.length).toBe(1);
    
    // 验证名称是否正确
    const classNames = classes.map(c => {
      const nameCapture = captures.find(cap => 
        cap.name === 'name' && 
        Math.abs(cap.node.startPosition.row - c.node.startPosition.row) < 5
      );
      return nameCapture?.node.text;
    });
    expect(classNames).toContain('DemoClass');
    
    // 验证方法名称
    const methodNames = methods.map(m => {
      const nameCapture = captures.find(cap => 
        cap.name === 'name' && 
        Math.abs(cap.node.startPosition.row - m.node.startPosition.row) < 3
      );
      return nameCapture?.node.text;
    });
    expect(methodNames).toContain('interfaceMethod');
    expect(methodNames).toContain('traitMethod');
    
    // 验证是否获取到了注释
    const comments = captures.filter(c => c.name === 'comment');
    expect(comments.length).toBeGreaterThan(0);
    
    // 验证接口名称
    const interfaceNames = interfaces.map(i => {
      const nameCapture = captures.find(cap => 
        cap.name === 'name' && 
        Math.abs(cap.node.startPosition.row - i.node.startPosition.row) < 3
      );
      return nameCapture?.node.text;
    });
    expect(interfaceNames).toContain('DemoInterface');
    
    // 验证特征名称
    const traitNames = traits.map(t => {
      const nameCapture = captures.find(cap => 
        cap.name === 'name' && 
        Math.abs(cap.node.startPosition.row - t.node.startPosition.row) < 3
      );
      return nameCapture?.node.text;
    });
    expect(traitNames).toContain('DemoTrait');
    
    // 验证函数名称
    const functionNames = functions.map(f => {
      const nameCapture = captures.find(cap => 
        cap.name === 'name' && 
        Math.abs(cap.node.startPosition.row - f.node.startPosition.row) < 3
      );
      return nameCapture?.node.text;
    });
    expect(functionNames).toContain('demoFunction');
  });
});
