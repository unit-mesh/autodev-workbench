import { NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

// 示例编码规范数据
const sampleGuidelines = [
  {
    title: 'JavaScript 编码规范',
    description: '包含ES6+语法推荐、模块化结构和最佳实践的综合指南',
    language: 'javascript',
    category: { subcategory: 'frontend' },
    version: '2.1.0',
    content: `
      ## JavaScript 编码规范

      ### 命名约定
      - 使用驼峰命名法(camelCase)命名变量和函数
      - 使用PascalCase命名类和构造函数
      - 使用UPPER_CASE命名常量

      ### 模块化
      - 优先使用ES模块(import/export)
      - 避免全局变量污染
      - 一个模块只做一件事

      ### 异步编程
      - 优先使用async/await而非原始Promise链
      - 正确处理异常捕获
      - 避免回调地狱

      ### 代码格式化
      - 使用2个空格缩进
      - 语句结尾使用分号
      - 最大行长度80-100个字符
    `,
    status: 'PUBLISHED',
    popularity: 95,
  },
  {
    title: 'React 组件开发规范',
    description: '面向React组件开发的规范，包含Hooks使用、状态管理和性能优化建议',
    language: 'javascript',
    category: { subcategory: 'frontend' },
    version: '3.0.1',
    content: `
      ## React 组件开发规范

      ### 组件结构
      - 使用函数组件和Hooks而非类组件
      - 保持组件职责单一
      - 组件文件名与组件名保持一致

      ### Hooks使用
      - 遵循Hooks使用规则(不在条件语句中使用)
      - 使用自定义Hooks抽象共享逻辑
      - 合理使用useMemo和useCallback优化性能

      ### 状态管理
      - 本地状态使用useState
      - 复杂状态考虑使用useReducer
      - 跨组件共享状态使用Context API或状态管理库

      ### 性能优化
      - 使用React.memo包装纯组件
      - 通过key属性优化列表渲染
      - 避免不必要的重渲染
    `,
    status: 'PUBLISHED',
    popularity: 89,
  },
  {
    title: 'Python PEP 8 规范指南',
    description: 'Python官方PEP 8编码风格的企业版实践指南，包含自动化工具配置',
    language: 'python',
    category: { subcategory: 'backend' },
    version: '1.2.0',
    content: `
      ## Python PEP 8 规范指南
      
      ### 代码布局
      - 使用4个空格进行缩进
      - 每行最大长度为79个字符
      - 顶级函数和类定义用两个空行分隔
      - 类中的方法定义用一个空行分隔
      
      ### 导入规范
      - 导入应当分行书写
      - 导入顺序: 标准库、第三方库、本地库
      - 避免使用通配符导入
      
      ### 命名规范
      - 变量名全小写，多单词用下划线连接
      - 类名使用CapWords约定
      - 常量用大写字母，下划线连接
      
      ### 注释规范
      - 使用docstring记录模块、函数、类、方法
      - 使用Google或NumPy风格的文档字符串
      - 注释应该是完整的句子
    `,
    status: 'PUBLISHED',
    popularity: 92,
  },
  {
    title: '微服务架构规范',
    description: '企业级微服务设计原则和最佳实践指南',
    language: 'general',
    category: { subcategory: 'architecture' },
    version: '1.0.0',
    content: `
      ## 微服务架构规范
      
      ### 服务拆分原则
      - 按业务能力进行服务拆分
      - 遵循单一职责原则
      - 边界明确，高内聚，低耦合
      
      ### 接口设计
      - 使用标准REST或gRPC通信
      - 遵循API版本化管理
      - 设计幂等性接口
      
      ### 数据管理
      - 每个服务拥有独立数据存储
      - 避免跨服务数据库访问
      - 使用事件溯源模式维护数据一致性
      
      ### 弹性设计
      - 实现服务熔断和降级
      - 采用重试机制处理临时故障
      - 设计隔离舱防止故障扩散
    `,
    status: 'PUBLISHED',
    popularity: 85,
  },
  {
    title: 'Kotlin 编码规范',
    description: 'Kotlin语言最佳实践和编码风格指南',
    language: 'kotlin',
    category: { subcategory: 'backend' },
    version: '1.1.0',
    content: `
      ## Kotlin 编码规范
      
      ### 命名约定
      - 使用驼峰命名法(camelCase)命名变量和函数
      - 使用PascalCase命名类和接口
      - 使用UPPER_SNAKE_CASE命名常量

      ### 语言特性使用
      - 优先使用val而非var
      - 利用扩展函数增强代码可读性
      - 使用数据类简化模型定义
      
      ### 空安全处理
      - 避免使用!!操作符
      - 合理使用let、run和apply作用域函数
      - 默认参数代替重载函数
      
      ### 函数式编程
      - 适当使用高阶函数
      - 使用lambda表达式简化代码
      - 利用集合操作符代替手动迭代
    `,
    status: 'DRAFT',
    popularity: 78,
  },
];

export async function GET() {
  const client = createClient();
  try {
    await client.connect();
    
    // 检查表是否已存在
    const { rows } = await client.sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'Guideline'
      );
    `;
    
    const tableExists = rows[0].exists;
    
    if (!tableExists) {
      // 创建表
      await client.sql`
        CREATE TYPE "Status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
        
        CREATE TABLE "Guideline" (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          category JSONB NOT NULL,
          language TEXT NOT NULL DEFAULT 'general',
          content TEXT NOT NULL,
          version TEXT,
          "lastUpdated" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          popularity INTEGER DEFAULT 0,
          status "Status" DEFAULT 'DRAFT',
          "createdBy" TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      // 插入示例数据
      const now = new Date();
      
      for (const guideline of sampleGuidelines) {
        await client.sql`
          INSERT INTO "Guideline" (
            "title", 
            "description", 
            "category", 
            "language", 
            "content", 
            "version", 
            "status", 
            "popularity",
            "lastUpdated", 
            "createdBy", 
            "createdAt", 
            "updatedAt"
          ) 
          VALUES (
            ${guideline.title}, 
            ${guideline.description}, 
            ${JSON.stringify(guideline.category)}, 
            ${guideline.language}, 
            ${guideline.content}, 
            ${guideline.version}, 
            ${guideline.status}, 
            ${guideline.popularity}, 
            ${now}, 
            ${'system'}, 
            ${now}, 
            ${now}
          )
        `;
      }
      
      return NextResponse.json({ message: '数据表和示例数据已成功创建' });
    }
    
    // 检查是否有数据
    const { rows: dataRows } = await client.sql`
      SELECT COUNT(*) FROM "Guideline"
    `;
    
    if (parseInt(dataRows[0].count) === 0) {
      // 表存在但无数据，插入示例数据
      const now = new Date();
      
      for (const guideline of sampleGuidelines) {
        await client.sql`
          INSERT INTO "Guideline" (
            "title", 
            "description", 
            "category", 
            "language", 
            "content", 
            "version", 
            "status", 
            "popularity",
            "lastUpdated", 
            "createdBy", 
            "createdAt", 
            "updatedAt"
          ) 
          VALUES (
            ${guideline.title}, 
            ${guideline.description}, 
            ${JSON.stringify(guideline.category)}, 
            ${guideline.language}, 
            ${guideline.content}, 
            ${guideline.version}, 
            ${guideline.status}, 
            ${guideline.popularity}, 
            ${now}, 
            ${'system'}, 
            ${now}, 
            ${now}
          )
        `;
      }
      
      return NextResponse.json({ message: '示例数据已成功创建' });
    }
    
    return NextResponse.json({ message: '数据表已存在且包含数据' });
  } catch (error) {
    console.error('设置数据库失败:', error);
    return NextResponse.json(
      { error: '设置数据库失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
