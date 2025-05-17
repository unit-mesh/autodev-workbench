import { describe, it, expect, beforeEach } from 'vitest';

import { TestLanguageServiceProvider } from "../TestLanguageService";
import { KotlinStructurerProvider } from "../../code-context/kotlin/KotlinStructurerProvider";
import { CodeFile } from "../../codemodel/CodeElement";

const Parser = require('web-tree-sitter');

describe('KotlinStructure', () => {
  it('should convert a simple Kotlin file to CodeFile', async () => {
    const kotlinHelloWorld = `package com.example

import kotlin.collections.List

@SpringBootApplication
class ExampleClass {
    fun exampleMethod(param1: String, param2: Int): Unit {
        println("Hello World")
    }
}`;

    await Parser.init();
    const parser = new Parser();
    const languageService = new TestLanguageServiceProvider(parser);

    const structurer = new KotlinStructurerProvider();
    await structurer.init(languageService);

    const codeFile = await structurer.parseFile(kotlinHelloWorld, '');
    expect(codeFile as CodeFile).toEqual({
      name: '',
      filepath: '',
      language: 'kotlin',
      functions: [],
      path: '',
      package: 'com.example',
      imports: ['kotlin.collections.List'],
      classes: [
        {
          type: 'class',
          annotations: [
            {
              name: 'SpringBootApplication',
              keyValues: [],
            },
          ],
          constant: [],
          extends: [],
          fields: [],
          methods: [
            {
              vars: [],
              name: 'exampleMethod',
              annotations: [],
              start: {
                row: 6,
                column: 4,
              },
              end: {
                row: 8,
                column: 5,
              },
              returnType: 'Unit',
            },
          ],
          name: 'ExampleClass',
          canonicalName: 'com.example.ExampleClass',
          package: 'com.example',
          implements: [],
          start: {
            row: 4,
            column: 0,
          },
          end: {
            row: 9,
            column: 1,
          },
        },
      ],
    });
  });

  it('should parse annotations with values', async () => {
    const kotlinSpringController = `package com.example.demo.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
class HelloController {

    @GetMapping("/hello")
    fun hello(@RequestParam name: String): String {
        return "Hello, \${name}!"
    }

    @GetMapping("/greet/{username}")
    fun greet(@PathVariable username: String): String {
        return "Greetings, \${username}!"
    }
}`;

    await Parser.init();
    const parser = new Parser();
    const languageService = new TestLanguageServiceProvider(parser);

    const structurer = new KotlinStructurerProvider();
    await structurer.init(languageService);

    const codeFile = await structurer.parseFile(kotlinSpringController, '');
    expect(codeFile as CodeFile).toEqual({
      name: '',
      filepath: '',
      language: 'kotlin',
      functions: [],
      path: '',
      package: 'com.example.demo.controller',
      imports: [
        'org.springframework.web.bind.annotation.GetMapping',
        'org.springframework.web.bind.annotation.PathVariable',
        'org.springframework.web.bind.annotation.RequestParam',
        'org.springframework.web.bind.annotation.RestController'
      ],
      classes: [
        {
          type: 'class',
          canonicalName: 'com.example.demo.controller.HelloController',
          constant: [],
          extends: [],
          methods: [
            {
              vars: [],
              name: 'hello',
              annotations: [
                {
                  name: 'GetMapping',
                  keyValues: [
                    {
                      key: 'value',
                      value: '/hello'
                    }
                  ],
                }
              ],
              start: {
                row: 10,
                column: 4,
              },
              end: {
                row: 13,
                column: 5,
              },
              returnType: 'String',
            },
            {
              vars: [],
              name: 'greet',
              annotations: [
                {
                  name: 'GetMapping',
                  keyValues: [
                    {
                      key: 'value',
                      value: '/greet/{username}'
                    }
                  ],
                }
              ],
              start: {
                row: 15,
                column: 4,
              },
              end: {
                row: 18,
                column: 5,
              },
              returnType: 'String',
            }
          ],
          name: 'HelloController',
          package: 'com.example.demo.controller',
          implements: [],
          start: {
            row: 7,
            column: 0,
          },
          end: {
            row: 19,
            column: 1,
          },
          annotations: [
            {
              name: 'RestController',
              keyValues: [],
            }
          ],
          fields: [],
        },
      ],
    });
  });

  it('should parse data classes with properties', async () => {
    const kotlinDataClass = `package com.example.model

data class User(
    val id: Long,
    val name: String,
    val email: String,
    val age: Int
)`;

    await Parser.init();
    const parser = new Parser();
    const languageService = new TestLanguageServiceProvider(parser);

    const structurer = new KotlinStructurerProvider();
    await structurer.init(languageService);

    const codeFile = await structurer.parseFile(kotlinDataClass, '');
    expect(codeFile as CodeFile).toEqual({
      name: '',
      filepath: '',
      language: 'kotlin',
      functions: [],
      path: '',
      package: 'com.example.model',
      imports: [],
      classes: [
        {
          type: 'class',
          canonicalName: 'com.example.model.User',
          constant: [],
          extends: [],
          methods: [],
          name: 'User',
          package: 'com.example.model',
          implements: [],
          start: {
            row: 2,
            column: 0,
          },
          end: {
            row: 7,
            column: 1,
          },
          annotations: [],
          fields: [
            {
              name: 'id',
              start: {
                row: 0,
                column: 0,
              },
              end: {
                row: 0,
                column: 0,
              },
              type: 'Long',
            },
            {
              name: 'name',
              start: {
                row: 0,
                column: 0,
              },
              end: {
                row: 0,
                column: 0,
              },
              type: 'String',
            },
            {
              name: 'email',
              start: {
                row: 0,
                column: 0,
              },
              end: {
                row: 0,
                column: 0,
              },
              type: 'String',
            },
            {
              name: 'age',
              start: {
                row: 0,
                column: 0,
              },
              end: {
                row: 0,
                column: 0,
              },
              type: 'Int',
            }
          ],
        },
      ],
    });
  });

  it('should parse methods with annotations correctly', async () => {
    const kotlinWithMethodAnnotations = `package com.example.demo

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable

class TestController {
    @GetMapping("/api/test")
    fun testMethod(@PathVariable id: String): String {
        return "Test $id"
    }
}`;

    await Parser.init();
    const parser = new Parser();
    const languageService = new TestLanguageServiceProvider(parser);

    const structurer = new KotlinStructurerProvider();
    await structurer.init(languageService);

    const codeFile = await structurer.parseFile(kotlinWithMethodAnnotations, '');

    // 验证方法注解是否被正确解析
    const testMethod = codeFile?.classes[0]?.methods[0];
    expect(testMethod?.annotations).toBeDefined();
    expect(testMethod?.annotations?.length).toEqual(1);
    expect(testMethod?.annotations?.[0].name).toEqual('GetMapping');
    expect(testMethod?.annotations?.[0].keyValues?.[0].key).toEqual('value');
    expect(testMethod?.annotations?.[0].keyValues?.[0].value).toEqual('/api/test');
  });
});
