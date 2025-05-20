import { describe, it, expect, beforeEach } from 'vitest';

import { TestLanguageServiceProvider } from "../../TestLanguageService";
import { PythonStructurer } from "../../../code-context/python/PythonStructurer";
import { CodeFile } from "../../../codemodel/CodeElement";

const Parser = require('web-tree-sitter');

describe('PythonStructure', () => {
  it('should convert a simple Python file to CodeFile', async () => {
    const pythonHelloWorld = `import sys

class ExampleClass:
    def example_method(self, param1, param2):
        print("Hello World")
`;

    await Parser.init();
    const parser = new Parser();
    const languageService = new TestLanguageServiceProvider(parser);

    const structurer = new PythonStructurer();
    await structurer.init(languageService);

    const codeFile = await structurer.parseFile(pythonHelloWorld, '');
    expect(codeFile as CodeFile).toEqual({
      name: '',
      filepath: '',
      language: 'python',
      functions: [], // 确保顶级函数为空，因为这里只有类方法
      package: '',
      imports: ['sys'],
      classes: [
        {
          type: 'class',
          canonicalName: '',
          constant: [],
          extends: [],
          methods: [
            {
              vars: [],
              name: 'example_method',
              start: {
                row: 3,
                column: 4,
              },
              end: {
                row: 4,
                column: 28,
              },
            },
          ],
          name: 'ExampleClass',
          package: '',
          implements: [],
          start: {
            row: 2,
            column: 0,
          },
          end: {
            row: 4,
            column: 28,
          },
        },
      ],
    });
  });

  it('should parse class inheritance correctly', async () => {
    const pythonWithInheritance = `
class BaseClass:
    def base_method(self):
        pass

class ChildClass(BaseClass):
    def child_method(self):
        print("Child method")
        
    def another_method(self, param):
        return param
`;

    await Parser.init();
    const parser = new Parser();
    const languageService = new TestLanguageServiceProvider(parser);

    const structurer = new PythonStructurer();
    await structurer.init(languageService);

    const codeFile = await structurer.parseFile(pythonWithInheritance, '');

    expect(codeFile?.classes.length).toEqual(2);
    expect(codeFile?.classes[0].name).toEqual('BaseClass');
    expect(codeFile?.classes[0].methods.length).toEqual(1);
    expect(codeFile?.classes[0].methods[0].name).toEqual('base_method');

    expect(codeFile?.classes[1].name).toEqual('ChildClass');
    expect(codeFile?.classes[1].extends).toContain('BaseClass');
    expect(codeFile?.classes[1].methods.length).toEqual(2);
    expect(codeFile?.classes[1].methods[0].name).toEqual('child_method');
    expect(codeFile?.classes[1].methods[1].name).toEqual('another_method');

    // 确保没有顶级函数
    expect(codeFile?.functions.length).toEqual(0);
  });

  it('should parse top-level functions and imports', async () => {
    const pythonWithFunctions = `import os
from datetime import datetime
import sys as system

def main_function():
    print("This is the main function")
    
def another_function(param1, param2="default"):
    return param1 + param2

class TestClass:
    attribute = "test"
    
    def class_method(self):
        pass
`;

    await Parser.init();
    const parser = new Parser();
    const languageService = new TestLanguageServiceProvider(parser);

    const structurer = new PythonStructurer();
    await structurer.init(languageService);

    const codeFile = await structurer.parseFile(pythonWithFunctions, '');

    // 验证顶级函数
    expect(codeFile?.functions.length).toEqual(2);
    expect(codeFile?.functions[0].name).toEqual('main_function');
    expect(codeFile?.functions[1].name).toEqual('another_function');

    // 验证类和类方法
    expect(codeFile?.classes.length).toEqual(1);
    expect(codeFile?.classes[0].name).toEqual('TestClass');
    expect(codeFile?.classes[0].fields?.length).toEqual(1);
    expect(codeFile?.classes[0].fields?.[0].name).toEqual('attribute');
    expect(codeFile?.classes[0].methods.length).toEqual(1);
    expect(codeFile?.classes[0].methods[0].name).toEqual('class_method');
  });

  it('should not add class methods to top-level functions', async () => {
    const pythonMixedCode = `
def top_level_function():
    print("I am a top-level function")

class MyClass:
    def class_method(self):
        print("I am a class method")
        
    def another_method(self):
        return "Another method"

def another_top_level():
    return "Another top level"
`;

    await Parser.init();
    const parser = new Parser();
    const languageService = new TestLanguageServiceProvider(parser);

    const structurer = new PythonStructurer();
    await structurer.init(languageService);

    const codeFile = await structurer.parseFile(pythonMixedCode, '');

    // 检查顶级函数不包括类方法
    expect(codeFile?.functions.length).toEqual(2);
    const functionNames = codeFile?.functions.map(f => f.name);
    expect(functionNames).toContain('top_level_function');
    expect(functionNames).toContain('another_top_level');
    expect(functionNames).not.toContain('class_method');
    expect(functionNames).not.toContain('another_method');

    // 检查类方法正确添加到类中
    expect(codeFile?.classes.length).toEqual(1);
    expect(codeFile?.classes[0].methods.length).toEqual(2);
    const methodNames = codeFile?.classes[0].methods.map(m => m.name);
    expect(methodNames).toContain('class_method');
    expect(methodNames).toContain('another_method');
  });
});
