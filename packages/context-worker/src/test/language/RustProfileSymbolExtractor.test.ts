import { describe, expect, it } from 'vitest';

import { TestLanguageServiceProvider } from "../TestLanguageService";
import { RustProfile } from "../../code-context/rust/RustProfile";

const Parser = require('web-tree-sitter');

describe('RustProfile SymbolExtractor', () => {
  it('should extract symbols from Rust code', async () => {
    const rustCode = `
/**
 * 示例模块
 */
mod example {
    /**
     * 示例结构体
     */
    pub struct DemoStruct {
        /**
         * 结构体字段
         */
        pub demo_field: String,
    }

    /**
     * 示例枚举
     */
    pub enum DemoEnum {
        VariantOne,
        VariantTwo(i32),
        VariantThree { value: String },
    }

    /**
     * 示例特征
     */
    pub trait DemoTrait {
        /**
         * 特征方法签名
         */
        fn trait_method(&self, param: &str);
    }

    /**
     * 示例常量
     */
    pub const DEMO_CONSTANT: &str = "demo value";

    /**
     * 示例函数
     */
    pub fn demo_function(arg: i32) -> i32 {
        arg + 1
    }

    /**
     * 结构体实现块
     */
    impl DemoStruct {
        /**
         * 结构体方法
         */
        pub fn struct_method(&self) {
            println!("Hello from struct method");
        }
    }

    /**
     * 特征实现块
     */
    impl DemoTrait for DemoStruct {
        fn trait_method(&self, param: &str) {
            println!("Hello {}", param);
        }
    }
}
`;

    await Parser.init();
    const parser = new Parser();
    const languageService = new TestLanguageServiceProvider(parser);

    const rustProfile = new RustProfile();
    const rustLanguage = await languageService.getLanguage('rust');
    parser.setLanguage(rustLanguage);

    const tree = parser.parse(rustCode);
    const symbolExtractorQuery = rustProfile.symbolExtractor.query(rustLanguage);
    const captures = symbolExtractorQuery.captures(tree.rootNode);

    // 按类型分组捕获的符号
    const structs = captures.filter(c => c.name === 'definition.struct');
    const functions = captures.filter(c => c.name === 'definition.function');
    const methods = captures.filter(c => c.name === 'definition.method');
    const traits = captures.filter(c => c.name === 'definition.trait');
    const enums = captures.filter(c => c.name === 'definition.enum');
    const constants = captures.filter(c => c.name === 'definition.constant');
    const fields = captures.filter(c => c.name === 'definition.field');
    const modules = captures.filter(c => c.name === 'definition.module');

    // 验证每种符号类型是否被正确捕获
    expect(structs.length).toBe(1);
    expect(functions.length).toBe(3);
    expect(methods.length).toBeGreaterThan(0); // 应该至少有一个方法
    expect(traits.length).toBe(1);
    expect(enums.length).toBe(1);
    expect(constants.length).toBe(1);

    // 验证结构体名称
    const structNames = captures
      .filter(c => c.name === 'struct-name')
      .map(c => c.node.text);
    expect(structNames).toContain('DemoStruct');

    // 验证函数名称
    const functionNames = captures
      .filter(c => c.name === 'function-name')
      .map(c => c.node.text);
    expect(functionNames).toContain('demo_function');

    // 验证方法名称
    const methodNames = captures
      .filter(c => c.name === 'method-name')
      .map(c => c.node.text);
    expect(methodNames).toContain('struct_method');

    // 验证特征名称
    const traitNames = captures
      .filter(c => c.name === 'trait-name')
      .map(c => c.node.text);
    expect(traitNames).toContain('DemoTrait');

    // 验证枚举名称
    const enumNames = captures
      .filter(c => c.name === 'enum-name')
      .map(c => c.node.text);
    expect(enumNames).toContain('DemoEnum');

    // 验证常量名称
    const constantNames = captures
      .filter(c => c.name === 'constant-name')
      .map(c => c.node.text);
    expect(constantNames).toContain('DEMO_CONSTANT');

    // 验证模块名称
    const moduleNames = captures
      .filter(c => c.name === 'module-name')
      .map(c => c.node.text);
    expect(moduleNames).toContain('example');

    // 验证是否获取到了注释
    const comments = captures.filter(c => c.name === 'comment');
    expect(comments.length).toBeGreaterThan(0);
  });
});
