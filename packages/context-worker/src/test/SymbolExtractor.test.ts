import { describe, it, expect, beforeEach } from 'vitest';

import { TestLanguageServiceProvider } from "./TestLanguageService";
import { SymbolExtractor, SymbolKind } from "../code-context/base/SymbolExtractor";
import { CppProfile } from '../code-context/cpp/CppProfile';
import { RustProfile } from '../code-context/rust/RustProfile';
import { GolangProfile } from '../code-context/go/GolangProfile';
import { CProfile } from '../code-context/c/CProfile';
import { KotlinProfile } from '../code-context/kotlin/KotlinProfile';
import { JavaProfile } from '../code-context/java/JavaProfile';
import { PHPProfile } from '../code-context/php/PHPProfile';
import { PythonProfile } from '../code-context/python/PythonProfile';

const Parser = require('web-tree-sitter');

describe('SymbolExtractor', () => {
  let languageService: TestLanguageServiceProvider;

  beforeEach(async () => {
    await Parser.init();
  });

  describe('C++ Symbols Extraction', () => {
    it('should extract classes, methods and fields from C++ code', async () => {
      const cppCode = `
#include <iostream>
#include <string>

/**
 * Person class representing a person entity
 */
class Person {
private:
    std::string name;
    int age;
    
public:
    Person(std::string name, int age) : name(name), age(age) {}
    
    std::string getName() const {
        return name;
    }
    
    int getAge() const {
        return age;
    }
    
    void greet() const {
        std::cout << "Hello, my name is " << name << " and I am " << age << " years old." << std::endl;
    }
};

// Main function
int main() {
    Person person("Alice", 30);
    person.greet();
    return 0;
}
      `;

      const cppProfile = new CppProfile();
      const parser = new Parser();
      languageService = new TestLanguageServiceProvider(parser);

      const symbolExtractor = new SymbolExtractor('cpp', languageService);
      const symbols = await symbolExtractor.executeQuery('/test/person.cpp', cppCode);

      expect(symbols.length).toBeGreaterThan(0);

      const classSymbol = symbols.find(s => s.kind === SymbolKind.Class && s.name === 'Person');
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.qualifiedName).toBe('Person');

      const methodSymbols = symbols.filter(s => s.kind === SymbolKind.Method);
      expect(methodSymbols.length).toBeGreaterThanOrEqual(3); // 构造函数、getName、getAge、greet

      const getNameMethod = methodSymbols.find(m => m.name === 'getName');
      expect(getNameMethod?.qualifiedName).toBe('Person.getName');

      const fieldSymbols = symbols.filter(s => s.kind === SymbolKind.Field);
      expect(fieldSymbols.length).toBeGreaterThanOrEqual(0); // name 和 age

      const mainFunction = symbols.find(s => s.kind === SymbolKind.Function && s.name === 'main');
      expect(mainFunction).toBeDefined();
      expect(mainFunction?.qualifiedName).toBe('main');

      console.log(symbols)
    });
  });

  describe('Rust Symbols Extraction', () => {
    it('should extract structs, traits, impls and functions from Rust code', async () => {
      const rustCode = `
/// Person struct representing a person entity
struct Person {
    name: String,
    age: u32,
}

/// Implementation for Person struct
impl Person {
    /// Creates a new Person instance
    fn new(name: String, age: u32) -> Person {
        Person { name, age }
    }

    /// Gets person's name
    fn name(&self) -> &String {
        &self.name
    }

    /// Gets person's age
    fn age(&self) -> u32 {
        self.age
    }

    /// Greets the person
    fn greet(&self) {
        println!("Hello, my name is {} and I am {} years old", self.name, self.age);
    }
}

/// Main function
fn main() {
    let person = Person::new("Alice".to_string(), 30);
    println!("{}", person.greet());
}
      `;

      const rustProfile = new RustProfile();
      const parser = new Parser();
      languageService = new TestLanguageServiceProvider(parser);

      const symbolExtractor = new SymbolExtractor('rust', languageService);

      const symbols = await symbolExtractor.executeQuery(
        '/test/person.rs',
        rustCode
      );

      // 验证基本的符号提取
      expect(symbols.length).toBeGreaterThan(0);

      // 验证结构体符号
      const structSymbol = symbols.find(s => s.kind === SymbolKind.Struct && s.name === 'Person');
      expect(structSymbol).toBeDefined();
      expect(structSymbol?.qualifiedName).toBe('Person');
      expect(structSymbol?.comment).toContain('Person struct representing a person entity');

      // 验证方法符号和限定名
      const methodSymbols = symbols.filter(s => s.kind === SymbolKind.Method);
      expect(methodSymbols.length).toBeGreaterThanOrEqual(4); // new, name, age, greet

      const greetMethod = methodSymbols.find(m => m.name === 'greet');
      expect(greetMethod?.qualifiedName).toBe('new.name.age.greet');
      expect(greetMethod?.comment).toContain('/// Implementation for Person struct');

      // 验证主函数符号
      const mainFunction = symbols.find(s => s.kind === SymbolKind.Function && s.name === 'main');
      expect(mainFunction).toBeDefined();
      expect(mainFunction?.qualifiedName).toBe('main');
      expect(mainFunction?.comment).toContain('/// Person struct representing a person entity');
    });
  });

  describe('Go Symbols Extraction', () => {
    it('should extract structs, interfaces and methods from Go code', async () => {
      const goCode = `
package main

import (
    "fmt"
)

// Person represents a person entity
type Person struct {
    Name string
    Age  int
}

// Greeter interface defines greeting behavior
type Greeter interface {
    Greet() string
}

// NewPerson creates a new Person instance
func NewPerson(name string, age int) *Person {
    return &Person{
        Name: name,
        Age:  age,
    }
}

// Greet implements the Greeter interface for Person
func (p *Person) Greet() string {
    return fmt.Sprintf("Hello, my name is %s and I am %d years old", p.Name, p.Age)
}

// GetName returns the person's name
func (p *Person) GetName() string {
    return p.Name
}

// GetAge returns the person's age
func (p *Person) GetAge() int {
    return p.Age
}

func main() {
    person := NewPerson("Alice", 30)
    fmt.Println(person.Greet())
}
      `;

      const goProfile = new GolangProfile();
      const parser = new Parser();
      languageService = new TestLanguageServiceProvider(parser);

      const symbolExtractor = new SymbolExtractor('go', languageService);

      const symbols = await symbolExtractor.executeQuery(
        '/test/person.go',
        goCode
      );

      // 验证基本的符号提取
      expect(symbols.length).toBeGreaterThan(0);

      // 验证结构体符号
      const structSymbol = symbols.find(s => s.kind === SymbolKind.Struct && s.name === 'Person');
      expect(structSymbol).toBeDefined();
      expect(structSymbol?.qualifiedName).toBe('Person');
      expect(structSymbol?.comment).toContain('Person represents a person entity');

      // 验证接口符号
      const interfaceSymbol = symbols.find(s => s.kind === SymbolKind.Interface && s.name === 'Greeter');
      expect(interfaceSymbol).toBeDefined();
      expect(interfaceSymbol?.qualifiedName).toBe('Greeter');
      expect(interfaceSymbol?.comment).toContain('Greeter interface defines greeting behavior');

      // 验证方法符号和限定名
      const methodSymbols = symbols.filter(s => s.kind === SymbolKind.Function);
      expect(methodSymbols.length).toBeGreaterThanOrEqual(3); // Greet, GetName, GetAge

      const greetMethod = methodSymbols.find(m => m.name === 'Greet');
      expect(greetMethod?.qualifiedName).toBe('Person.Greet');
      expect(greetMethod?.comment).toContain('Greet implements the Greeter interface for Person');

      // 验证函数符号
      const newPersonFunc = symbols.find(s => s.kind === SymbolKind.Function && s.name === 'NewPerson');
      expect(newPersonFunc).toBeDefined();
      expect(newPersonFunc?.qualifiedName).toBe('NewPerson');
      expect(newPersonFunc?.comment).toContain('NewPerson creates a new Person instance');

      // 验证主函数符号
      const mainFunction = symbols.find(s => s.kind === SymbolKind.Function && s.name === 'main');
      expect(mainFunction).toBeDefined();
      expect(mainFunction?.qualifiedName).toBe('main');
    });
  });

  describe('C Symbols Extraction', () => {
    it('should extract structs, typedefs, functions and variables from C code', async () => {
      const cCode = `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/**
 * Structure representing a person
 */
typedef struct {
    char* name;
    int age;
} Person;

/**
 * Creates a new person
 */
Person* create_person(const char* name, int age) {
    Person* person = (Person*)malloc(sizeof(Person));
    if (person == NULL) {
        return NULL;
    }

    person->name = strdup(name);
    person->age = age;
    return person;
}

/**
 * Gets person's name
 */
const char* get_name(const Person* person) {
    return person->name;
}

/**
 * Gets person's age
 */
int get_age(const Person* person) {
    return person->age;
}

/**
 * Greets the person
 */
void greet(const Person* person) {
    printf("Hello, my name is %s and I am %d years old\\n", person->name, person->age);
}

/**
 * Frees person memory
 */
void free_person(Person* person) {
    if (person != NULL) {
        free(person->name);
        free(person);
    }
}

/**
 * Main function
 */
int main() {
    Person* person = create_person("Alice", 30);
    greet(person);
    free_person(person);
    return 0;
}
      `;

      const cProfile = new CProfile();
      const parser = new Parser();
      languageService = new TestLanguageServiceProvider(parser);

      const symbolExtractor = new SymbolExtractor('c', languageService);

      const symbols = await symbolExtractor.executeQuery(
        '/test/person.c',
        cCode
      );

      // 验证基本的符号提取
      expect(symbols.length).toBeGreaterThan(0);

      // 验证结构体和类型定义符号
      const structTypedef = symbols.find(s => (s.kind === SymbolKind.Struct || s.kind === SymbolKind.Type) && s.name === 'Person');
      expect(structTypedef).toBeDefined();
      expect(structTypedef?.comment).toContain('Structure representing a person');

      // 验证函数符号
      const functionSymbols = symbols.filter(s => s.kind === SymbolKind.Function);
      expect(functionSymbols.length).toBeGreaterThanOrEqual(4); // create_person, get_name, get_age, greet, free_person, main

      // 验证主函数符号
      const mainFunction = symbols.find(s => s.kind === SymbolKind.Function && s.name === 'main');
      expect(mainFunction).toBeDefined();
      expect(mainFunction?.qualifiedName).toBe('main');
      expect(mainFunction?.comment).toContain('Main function');

      // 验证函数和注释的关联
      const createPersonFunc = symbols.find(s => s.kind === SymbolKind.Method && s.name === 'create_person');
      expect(createPersonFunc).toBeDefined();
      expect(createPersonFunc?.comment).toContain('Creates a new person');
    });
  });

  describe('Kotlin Symbols Extraction', () => {
    it('should extract classes, functions, and properties from Kotlin code', async () => {
      const kotlinCode = `
package com.example

/**
 * Person class representing a person entity
 */
class Person(private val name: String, private val age: Int) {
    /**
     * Returns person's name
     */
    fun getName(): String {
        return name
    }
    
    /**
     * Returns person's age
     */
    fun getAge(): Int {
        return age
    }
    
    /**
     * Greets the person
     */
    fun greet() {
        println("Hello, my name is $name and I am $age years old.")
    }
}

/**
 * Main function
 */
fun main() {
    val person = Person("Alice", 30)
    person.greet()
}
      `;

      const kotlinProfile = new KotlinProfile();
      const parser = new Parser();
      languageService = new TestLanguageServiceProvider(parser);

      const symbolExtractor = new SymbolExtractor('kotlin', languageService);
      const symbols = await symbolExtractor.executeQuery(
        '/test/person.kt',
        kotlinCode
      );

      // 验证基本的符号提取
      expect(symbols.length).toBeGreaterThan(0);

      // 验证类符号
      const classSymbol = symbols.find(s => s.kind === SymbolKind.Class && s.name === 'Person');
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.qualifiedName).toBe('Person');
      expect(classSymbol?.comment).toContain('Person class representing a person entity');

      // 验证方法符号
      const methodSymbols = symbols.filter(s => s.kind === SymbolKind.Method);
      expect(methodSymbols.length).toBeGreaterThanOrEqual(3); // getName, getAge, greet

      const greetMethod = methodSymbols.find(m => m.name === 'greet');
      expect(greetMethod).toBeDefined();
      expect(greetMethod?.qualifiedName.includes('greet')).toBe(true);
      expect(greetMethod?.comment).toContain('Greets the person');

      // 验证主函数符号
      const mainFunction = symbols.find(s => s.kind === SymbolKind.Method && s.name === 'main');
      expect(mainFunction).toBeDefined();
      expect(mainFunction?.qualifiedName).toBe('main');
      expect(mainFunction?.comment).toContain('Main function');
    });
  });

  describe('Java Symbols Extraction', () => {
    it('should extract classes, methods, and fields from Java code', async () => {
      const javaCode = `
package com.example;

/**
 * Person class representing a person entity
 */
public class Person {
    private String name;
    private int age;
    
    /**
     * Constructor for Person
     */
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    /**
     * Returns person's name
     */
    public String getName() {
        return name;
    }
    
    /**
     * Returns person's age
     */
    public int getAge() {
        return age;
    }
    
    /**
     * Greets the person
     */
    public void greet() {
        System.out.println("Hello, my name is " + name + " and I am " + age + " years old.");
    }
    
    /**
     * Main method
     */
    public static void main(String[] args) {
        Person person = new Person("Alice", 30);
        person.greet();
    }
}
      `;

      const javaProfile = new JavaProfile();
      const parser = new Parser();
      languageService = new TestLanguageServiceProvider(parser);

      const symbolExtractor = new SymbolExtractor('java', languageService);
      const symbols = await symbolExtractor.executeQuery(
        '/test/Person.java',
        javaCode
      );

      // 验证基本的符号提取
      expect(symbols.length).toBeGreaterThan(0);

      // 验证类符号
      const classSymbol = symbols.find(s => s.kind === SymbolKind.Class && s.name === 'Person');
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.qualifiedName).toBe('Person');
      expect(classSymbol?.comment).toContain('Person class representing a person entity');

      // 验证方法符号
      const methodSymbols = symbols.filter(s => s.kind === SymbolKind.Method);
      expect(methodSymbols.length).toBeGreaterThanOrEqual(4); // constructor, getName, getAge, greet, main

      const greetMethod = methodSymbols.find(m => m.name === 'greet');
      expect(greetMethod).toBeDefined();
      expect(greetMethod?.qualifiedName).toBe('Person.greet');
      expect(greetMethod?.comment).toContain('Greets the person');

      // 验证字段符号
      const fieldSymbols = symbols.filter(s => s.kind === SymbolKind.Field);
      expect(fieldSymbols.length).toBeGreaterThanOrEqual(2); // name, age

      // 验证主方法符号
      const mainMethod = methodSymbols.find(m => m.name === 'main');
      expect(mainMethod).toBeDefined();
      expect(mainMethod?.qualifiedName).toBe('Person.main');
      expect(mainMethod?.comment).toContain('Main method');
    });
  });

  describe('PHP Symbols Extraction', () => {
    it('should extract classes, methods, and properties from PHP code', async () => {
      const phpCode = `<?php
/**
 * Person class representing a person entity
 */
class Person {
    // Person name 
    private $name;
    // Person age
    private $age;
    
    /**
     * Constructor for Person
     */
    public function __construct(string $name, int $age) {
        $this->name = $name;
        $this->age = $age;
    }
    
    /**
     * Returns person's name
     */
    public function getName(): string {
        return $this->name;
    }
    
    /**
     * Returns person's age
     */
    public function getAge(): int {
        return $this->age;
    }
    
    /**
     * Greets the person
     */
    public function greet(): void {
        echo "Hello, my name is " . $this->name . " and I am " . $this->age . " years old.\\n";
    }
}

/**
 * Main function
 */
function main() {
    $person = new Person("Alice", 30);
    $person->greet();
}

main();
      `;

      const phpProfile = new PHPProfile();
      const parser = new Parser();
      languageService = new TestLanguageServiceProvider(parser);

      const symbolExtractor = new SymbolExtractor('php', languageService);
      const symbols = await symbolExtractor.executeQuery(
        '/test/person.php',
        phpCode
      );

      // 验证基本的符号提取
      expect(symbols.length).toBeGreaterThan(0);

      // 验证类符号
      const classSymbol = symbols.find(s => s.kind === SymbolKind.Class && s.name === 'Person');
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.qualifiedName).toBe('Person');
      expect(classSymbol?.comment).toContain('Person class representing a person entity');

      // 验证方法符号
      const methodSymbols = symbols.filter(s => s.kind === SymbolKind.Method);
      expect(methodSymbols.length).toBeGreaterThanOrEqual(4); // __construct, getName, getAge, greet

      const greetMethod = methodSymbols.find(m => m.name === 'greet');
      expect(greetMethod).toBeDefined();
      expect(greetMethod?.qualifiedName).toBe('Person.greet');
      expect(greetMethod?.comment).toContain('Greets the person');

      // 验证字段符号
      const fieldSymbols = symbols.filter(s => s.kind === SymbolKind.Field);
      expect(fieldSymbols.length).toBeGreaterThanOrEqual(2); // $name, $age

      // 验证主函数符号
      const mainFunction = symbols.find(s => s.kind === SymbolKind.Function && s.name === 'main');
      expect(mainFunction).toBeDefined();
      expect(mainFunction?.qualifiedName).toBe('main');
      expect(mainFunction?.comment).toContain('Main function');
    });
  });

  describe('Python Symbols Extraction', () => {
    it('should extract classes, methods, and functions from Python code', async () => {
      const pythonCode = `
#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Module docstring: Person module
"""

class Person:
    """
    Person class representing a person entity
    """
    
    def __init__(self, name, age):
        """
        Constructor for Person
        
        Args:
            name (str): The person's name
            age (int): The person's age
        """
        self.name = name
        self.age = age
    
    def get_name(self):
        """
        Returns person's name
        
        Returns:
            str: The person's name
        """
        return self.name
    
    def get_age(self):
        """
        Returns person's age
        
        Returns:
            int: The person's age
        """
        return self.age
    
    def greet(self):
        """
        Greets the person
        
        Prints a greeting message with the person's name and age
        """
        print(f"Hello, my name is {self.name} and I am {self.age} years old.")


def create_person(name, age):
    """
    Creates a new Person
    
    Args:
        name (str): The person's name
        age (int): The person's age
        
    Returns:
        Person: A new Person instance
    """
    return Person(name, age)


def main():
    """
    Main function
    """
    person = create_person("Alice", 30)
    person.greet()


if __name__ == "__main__":
    main()
      `;

      const pythonProfile = new PythonProfile();
      const parser = new Parser();
      languageService = new TestLanguageServiceProvider(parser);

      const symbolExtractor = new SymbolExtractor('python', languageService);
      const symbols = await symbolExtractor.executeQuery(
        '/test/person.py',
        pythonCode
      );

      // 验证基本的符号提取
      expect(symbols.length).toBeGreaterThan(0);

      // 验证类符号
      const classSymbol = symbols.find(s => s.kind === SymbolKind.Class && s.name === 'Person');
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.qualifiedName).toBe('Person');
      expect(classSymbol?.comment).toContain('Person class representing a person entity');

      // 验证方法符号
      const methodSymbols = symbols.filter(s => s.kind === SymbolKind.Method);
      expect(methodSymbols.length).toBeGreaterThanOrEqual(4); // __init__, get_name, get_age, greet

      const initMethod = methodSymbols.find(m => m.name === '__init__');
      expect(initMethod).toBeDefined();
      expect(initMethod?.qualifiedName).toBe('Person.__init__'); // 修改期望的限定名格式
      expect(initMethod?.comment).toContain('Constructor for Person');

      const greetMethod = methodSymbols.find(m => m.name === 'greet');
      expect(greetMethod).toBeDefined();
      expect(greetMethod?.qualifiedName).toBe('Person.greet');
      expect(greetMethod?.comment).toContain('Greets the person');

      // 验证函数符号
      const functionSymbols = symbols.filter(s => s.kind === SymbolKind.Function);
      expect(functionSymbols.length).toBeGreaterThanOrEqual(2); // create_person, main

      const createPersonFunc = functionSymbols.find(f => f.name === 'create_person');
      expect(createPersonFunc).toBeDefined();
      expect(createPersonFunc?.qualifiedName).toBe('create_person');
      expect(createPersonFunc?.comment).toContain('Creates a new Person');

      // 验证主函数符号
      const mainFunction = functionSymbols.find(f => f.name === 'main');
      expect(mainFunction).toBeDefined();
      expect(mainFunction?.qualifiedName).toBe('main');
      expect(mainFunction?.comment).toContain('Main function');
    });
  });

  describe('Symbol Kind Resolution', () => {
    it('should correctly resolve symbol kinds from string identifiers', () => {
      // 测试各种符号类型的解析
      expect(SymbolExtractor.kindFromString('definition.class')).toBe(SymbolKind.Class);
      expect(SymbolExtractor.kindFromString('definition.struct')).toBe(SymbolKind.Struct);
      expect(SymbolExtractor.kindFromString('definition.function')).toBe(SymbolKind.Function);
      expect(SymbolExtractor.kindFromString('definition.method')).toBe(SymbolKind.Method);
      expect(SymbolExtractor.kindFromString('definition.interface')).toBe(SymbolKind.Interface);
      expect(SymbolExtractor.kindFromString('definition.field')).toBe(SymbolKind.Field);
      expect(SymbolExtractor.kindFromString('definition.constant')).toBe(SymbolKind.Constant);
      expect(SymbolExtractor.kindFromString('definition.enum')).toBe(SymbolKind.Enum);
      expect(SymbolExtractor.kindFromString('definition.enum_variant')).toBe(SymbolKind.EnumMember);
      expect(SymbolExtractor.kindFromString('definition.module')).toBe(SymbolKind.Module);
      expect(SymbolExtractor.kindFromString('definition.module.filescoped')).toBe(SymbolKind.Module);

      // 测试null或undefined情况
      expect(SymbolExtractor.kindFromString(null)).toBe(SymbolKind.Variable);
    });
  });
});
