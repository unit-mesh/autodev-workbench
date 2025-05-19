import { describe, expect, it } from 'vitest';

import { TestLanguageServiceProvider } from "../TestLanguageService";
import { CppProfile } from "../../code-context/cpp/CppProfile";

const Parser = require('web-tree-sitter');

describe('CppProfile SymbolExtractor', () => {
  it('should extract symbols from C++ code', async () => {
    const cppCode = `
/**
 * 示例头文件包含
 */
#include <iostream>
#include <string>
#include <vector>

/**
 * 常量宏定义
 */
#define MAX_SIZE 100

/**
 * 命名空间定义
 */
namespace example {

/**
 * 类前向声明
 */
class Shape;

/**
 * 接口类定义
 */
class Shape {
public:
  /**
   * 纯虚函数
   */
  virtual double area() const = 0;
  
  /**
   * 虚析构函数
   */
  virtual ~Shape() {}
};

/**
 * 枚举类型定义
 */
enum class Color {
  /**
   * 红色
   */
  Red,
  
  /**
   * 绿色
   */
  Green,
  
  /**
   * 蓝色
   */
  Blue
};

/**
 * 结构体定义
 */
struct Point {
  /**
   * x坐标
   */
  double x;
  
  /**
   * y坐标
   */
  double y;
  
  /**
   * 构造函数
   */
  Point(double x = 0, double y = 0) : x(x), y(y) {}
};

/**
 * 派生类定义
 */
class Circle : public Shape {
private:
  /**
   * 圆心
   */
  Point center;
  
  /**
   * 半径
   */
  double radius;
  
public:
  /**
   * 构造函数
   */
  Circle(const Point& p, double r) : center(p), radius(r) {}
  
  /**
   * 面积计算实现
   */
  double area() const override {
    return 3.14159 * radius * radius;
  }
};

/**
 * 模板类定义
 */
template<typename T>
class Container {
private:
  /**
   * 内部存储
   */
  std::vector<T> data;
  
public:
  /**
   * 添加元素
   */
  void add(const T& item) {
    data.push_back(item);
  }
  
  /**
   * 获取大小
   */
  size_t size() const {
    return data.size();
  }
};

/**
 * 类型别名定义
 */
typedef std::vector<int> IntVector;

/**
 * 现代类型别名
 */
using StringVector = std::vector<std::string>;

/**
 * 全局变量
 */
int globalCounter = 0;

/**
 * 全局函数声明
 */
double calculateDistance(const Point& p1, const Point& p2);

/**
 * 全局函数定义
 */
double calculateDistance(const Point& p1, const Point& p2) {
  double dx = p1.x - p2.x;
  double dy = p1.y - p2.y;
  return std::sqrt(dx*dx + dy*dy);
}

} // namespace example

/**
 * 主函数
 */
int main() {
  /**
   * 局部变量
   */
  example::Point p1(1.0, 2.0);
  example::Point p2(4.0, 6.0);
  
  /**
   * 函数调用
   */
  double distance = example::calculateDistance(p1, p2);
  std::cout << "Distance: " << distance << std::endl;
  
  /**
   * 类实例化
   */
  example::Circle circle(p1, 2.5);
  std::cout << "Circle area: " << circle.area() << std::endl;
  
  /**
   * 模板实例化
   */
  example::Container<int> intContainer;
  intContainer.add(1);
  intContainer.add(2);
  intContainer.add(3);
  
  return 0;
}
`;

    await Parser.init();
    const parser = new Parser();
    const languageService = new TestLanguageServiceProvider(parser);

    const cppProfile = new CppProfile();
    const cppLanguage = await languageService.getLanguage('cpp');
    parser.setLanguage(cppLanguage);

    const tree = parser.parse(cppCode);
    const symbolExtractorQuery = cppProfile.symbolExtractor.query(cppLanguage);
    const captures = symbolExtractorQuery.captures(tree.rootNode);

    // 按类型分组捕获的符号
    const classes = captures.filter(c => c.name === 'definition.class');
    const structs = captures.filter(c => c.name === 'definition.struct');
    const namespaces = captures.filter(c => c.name === 'definition.namespace');
    const methods = captures.filter(c => c.name === 'definition.method');
    const functions = captures.filter(c => c.name === 'definition.function');
    const variables = captures.filter(c => c.name === 'definition.variable');
    const enums = captures.filter(c => c.name === 'definition.enum');
    const fields = captures.filter(c => c.name === 'definition.field');
    const macros = captures.filter(c => c.name === 'definition.macro');
    const typedefs = captures.filter(c => c.name === 'definition.typedef');
    const usings = captures.filter(c => c.name === 'definition.using');
    const templates = captures.filter(c => c.name === 'definition.template');

    // 验证每种符号类型是否被正确捕获
    expect(classes.length).toBeGreaterThan(0); // Shape, Circle
    expect(structs.length).toBeGreaterThan(0); // Point
    expect(namespaces.length).toBe(1); // example
    expect(methods.length).toBeGreaterThan(0); // 类方法
    expect(functions.length).toBeGreaterThan(0); // calculateDistance, main
    expect(variables.length).toBeGreaterThan(0); // globalCounter
    expect(enums.length).toBe(1); // Color
    expect(fields.length).toBeGreaterThan(0); // 类和结构体的字段
    expect(macros.length).toBe(1); // MAX_SIZE
    expect(typedefs.length).toBeGreaterThan(0); // IntVector

    // 验证类名称
    const classNames = classes.map(c => {
      const nameCapture = captures.find(cap =>
        cap.name === 'name' &&
        Math.abs(cap.node.startPosition.row - c.node.startPosition.row) < 5
      );
      return nameCapture?.node.text;
    }).filter(Boolean);
    expect(classNames).toContain('Shape');
    expect(classNames).toContain('Circle');

    // 验证结构体名称
    const structNames = structs.map(s => {
      const nameCapture = captures.find(cap =>
        cap.name === 'name' &&
        Math.abs(cap.node.startPosition.row - s.node.startPosition.row) < 5
      );
      return nameCapture?.node.text;
    }).filter(Boolean);
    expect(structNames).toContain('Point');

    // 验证命名空间名称
    const namespaceNames = namespaces.map(n => {
      const nameCapture = captures.find(cap =>
        cap.name === 'name' &&
        Math.abs(cap.node.startPosition.row - n.node.startPosition.row) < 5
      );
      return nameCapture?.node.text;
    });
    expect(namespaceNames).toContain('example');

    // 验证函数名称
    const functionNames = functions.map(f => {
      const nameCapture = captures.find(cap =>
        cap.name === 'name' &&
        Math.abs(cap.node.startPosition.row - f.node.startPosition.row) < 5
      );
      return nameCapture?.node.text;
    });
    expect(functionNames).toContain('main');
    expect(functionNames).toContain('calculateDistance');

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

    // 验证字段是否被提取
    const fieldNames = fields.map(f => f.node.text);
    expect(fieldNames.some(text => text.includes('x'))).toBeTruthy();
    expect(fieldNames.some(text => text.includes('y'))).toBeTruthy();
    expect(fieldNames.some(text => text.includes('radius'))).toBeTruthy();

    // 验证宏定义
    const macroNames = macros.map(m => {
      const nameCapture = captures.find(cap =>
        cap.name === 'name' &&
        Math.abs(cap.node.startPosition.row - m.node.startPosition.row) < 5
      );
      return nameCapture?.node.text;
    });
    expect(macroNames).toContain('MAX_SIZE');
  });
});
