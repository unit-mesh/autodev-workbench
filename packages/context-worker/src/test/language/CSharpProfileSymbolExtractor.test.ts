import { describe, expect, it } from 'vitest';

import { TestLanguageServiceProvider } from "../TestLanguageService";
import { CSharpProfile } from "../../code-context/csharp/CSharpProfile";

const Parser = require('web-tree-sitter');

describe('CSharpProfile SymbolExtractor', () => {
  it('should extract symbols from C# code', async () => {
    const csharpCode = `
using System;
using System.Collections.Generic;

namespace Demo.Example
{
    /// <summary>
    /// 示例接口
    /// </summary>
    public interface IDemoInterface
    {
        /// <summary>
        /// 接口方法
        /// </summary>
        void DoSomething(string input);
        
        /// <summary>
        /// 接口属性
        /// </summary>
        string Name { get; set; }
    }
    
    /// <summary>
    /// 示例枚举
    /// </summary>
    public enum DemoEnum
    {
        /// <summary>
        /// 第一个值
        /// </summary>
        First,
        
        /// <summary>
        /// 第二个值
        /// </summary>
        Second
    }
    
    /// <summary>
    /// 示例结构体
    /// </summary>
    public struct DemoStruct
    {
        /// <summary>
        /// 结构体字段
        /// </summary>
        public int X;
        
        /// <summary>
        /// 结构体方法
        /// </summary>
        public void Reset()
        {
            X = 0;
        }
    }
    
    /// <summary>
    /// 示例类
    /// </summary>
    public class DemoClass : IDemoInterface
    {
        /// <summary>
        /// 私有字段
        /// </summary>
        private string _name;
        
        /// <summary>
        /// 公共属性
        /// </summary>
        public string Name 
        { 
            get { return _name; }
            set { _name = value; }
        }
        
        /// <summary>
        /// 构造函数
        /// </summary>
        public DemoClass(string name)
        {
            _name = name;
        }
        
        /// <summary>
        /// 公共方法
        /// </summary>
        public void DoSomething(string input)
        {
            Console.WriteLine($"{Name} is processing {input}");
        }
    }
}`;

    await Parser.init();
    const parser = new Parser();
    const languageService = new TestLanguageServiceProvider(parser);
    
    const csharpProfile = new CSharpProfile();
    const csharpLanguage = await languageService.getLanguage('csharp');
    parser.setLanguage(csharpLanguage);
    
    const tree = parser.parse(csharpCode);
    const symbolExtractorQuery = csharpProfile.symbolExtractor.query(csharpLanguage);
    const captures = symbolExtractorQuery.captures(tree.rootNode);
    
    // 按类型分组捕获的符号
    const classes = captures.filter(c => c.name === 'definition.class');
    const methods = captures.filter(c => c.name === 'definition.method');
    const properties = captures.filter(c => c.name === 'definition.property');
    const fields = captures.filter(c => c.name === 'definition.field');
    const interfaces = captures.filter(c => c.name === 'definition.interface');
    const enums = captures.filter(c => c.name === 'definition.enum');
    const enumVariants = captures.filter(c => c.name === 'definition.enum_variant');
    const structs = captures.filter(c => c.name === 'definition.struct');
    const namespaces = captures.filter(c => c.name === 'definition.namespace');
    
    // 验证各种符号类型是否被正确捕获
    expect(classes.length).toBe(1);
    expect(methods.length).toBeGreaterThanOrEqual(2); // 至少2个方法: DoSomething在类和接口中，Reset在结构体中
    expect(properties.length).toBeGreaterThanOrEqual(1); // 至少1个属性: Name
    expect(fields.length).toBeGreaterThanOrEqual(1); // 至少1个字段: _name
    expect(interfaces.length).toBe(1);
    expect(enums.length).toBe(1);
    expect(enumVariants.length).toBe(2); // First和Second枚举值
    expect(structs.length).toBe(1);
    expect(namespaces.length).toBe(1);
    
    // 验证符号名称是否正确
    const classNames = classes.map(c => {
      const nameCapture = captures.find(cap => 
        cap.name === 'name' && 
        cap.node.type === 'identifier' &&
        Math.abs(cap.node.startPosition.row - c.node.startPosition.row) < 5
      );
      return nameCapture?.node.text;
    });
    expect(classNames).toContain('DemoClass');
    
    // 验证是否获取到了注释
    const comments = captures.filter(c => c.name === 'comment');
    expect(comments.length).toBeGreaterThan(0);
  });
});
