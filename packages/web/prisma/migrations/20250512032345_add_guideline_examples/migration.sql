INSERT INTO "Guideline" ("title", "description", "category", "language", "content", "version", "status", "popularity",
                         "createdBy", "lastUpdated", "createdAt", "updatedAt")
VALUES ('JavaScript 编码规范',
        '包含ES6+语法推荐、模块化结构和最佳实践的综合指南',
        '{"subcategory": "frontend"}',
        'javascript',
        '## JavaScript 编码规范

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
      - 最大行长度80-100个字符',
        '2.1.0',
        'PUBLISHED',
        95,
        'system',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       ('React 组件开发规范',
        '面向React组件开发的规范，包含Hooks使用、状态管理和性能优化建议',
        '{"subcategory": "frontend"}',
        'javascript',
        '## React 组件开发规范

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
      - 避免不必要的重渲染',
        '3.0.1',
        'PUBLISHED',
        89,
        'system',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       ('Python PEP 8 规范指南',
        'Python官方PEP 8编码风格的企业版实践指南，包含自动化工具配置',
        '{"subcategory": "backend"}',
        'python',
        '## Python PEP 8 规范指南

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
      - 注释应该是完整的句子',
        '1.2.0',
        'PUBLISHED',
        92,
        'system',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       ('TypeScript 类型系统规范',
        '如何在大型项目中正确使用TypeScript类型系统的最佳实践',
        '{"subcategory": "frontend"}',
        'typescript',
        '## TypeScript 类型系统规范

      ### 基本类型定义
      - 尽量避免使用any类型
      - 使用interface定义对象结构
      - 使用type定义联合类型和交叉类型

      ### 泛型使用
      - 适当使用泛型提高代码复用性
      - 为泛型参数提供默认类型
      - 使用泛型约束限制参数类型

      ### 类型声明文件
      - 为第三方库创建.d.ts声明文件
      - 使用命名空间组织复杂类型
      - 导出必要的类型供外部使用

      ### 高级类型技巧
      - 使用Readonly<T>防止对象变异
      - 使用Partial<T>处理部分更新
      - 使用Record<K,T>创建键值对映射',
        '2.4.0',
        'PUBLISHED',
        87,
        'system',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       ('Java 代码规范',
        '基于Google Java Style的企业级Java编码规范，包含命名、格式和注释要求',
        '{"subcategory": "backend"}',
        'java',
        '## Java 代码规范

      ### 文件结构
      - 每个Java文件只包含一个顶级类
      - 按照package、import、类这样的顺序组织代码
      - 避免超过2000行的源文件

      ### 命名约定
      - 类名使用PascalCase
      - 方法和变量使用camelCase
      - 常量使用UPPER_CASE

      ### 格式化规则
      - 使用4个空格缩进
      - 大括号总是使用Egyptian风格
      - 每行最多100个字符

      ### 编程实践
      - 避免使用原始类型的包装类
      - 优先使用接口而非实现类
      - 正确处理异常而不是简单地捕获',
        '4.2.1',
        'PUBLISHED',
        84,
        'system',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       ('Go 项目结构指南',
        '符合Go语言惯例的项目结构和代码组织指南，包含错误处理最佳实践',
        '{"subcategory": "backend"}',
        'go',
        '## Go 项目结构指南

      ### 项目布局
      - /cmd 放置主要应用程序入口点
      - /pkg 放置可以被外部应用程序使用的库代码
      - /internal 放置不希望别人导入的私有代码

      ### 命名约定
      - 使用短小的、有意义的变量名
      - 接口名应当以-er结尾
      - 避免包名和导入路径中的下划线

      ### 错误处理
      - 错误是值，应该被检查和处理
      - 使用errors.Is和errors.As进行错误比较
      - 使用fmt.Errorf和%w包装错误

      ### 代码组织
      - 保持包的小型化和聚焦
      - 避免循环依赖
      - 使用依赖注入而非全局变量',
        '1.5.0',
        'PUBLISHED',
        82,
        'system',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       ('RESTful API 设计规范',
        '面向微服务架构的RESTful API设计和版本管理指南',
        '{"subcategory": "architecture"}',
        'general',
        '## RESTful API 设计规范

      ### 资源命名
      - 使用名词复数形式命名资源集合
      - 使用连字符(-)而非下划线(_)
      - 路径全部使用小写字母

      ### HTTP方法使用
      - GET: 获取资源，不应有副作用
      - POST: 创建资源
      - PUT: 全量更新资源
      - PATCH: 部分更新资源
      - DELETE: 删除资源

      ### 状态码使用
      - 200: 成功
      - 201: 创建成功
      - 400: 客户端错误
      - 401/403: 未授权/禁止访问
      - 404: 资源不存在
      - 500: 服务器错误

      ### 版本管理
      - 在URL中使用版本号 (例如 /api/v1/resources)
      - 使用API网关进行版本路由
      - 保持向后兼容性',
        '3.1.2',
        'PUBLISHED',
        91,
        'system',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       ('C# 编码规范',
        '.NET Core和.NET 5+项目的C#编码风格指南，包含异步编程最佳实践',
        '{"subcategory": "backend"}',
        'csharp',
        '## C# 编码规范

      ### 命名规范
      - 使用PascalCase命名类型、属性、方法
      - 使用camelCase命名参数和局部变量
      - 接口前缀使用I (例如 IDisposable)

      ### 代码组织
      - 使用 #region 组织大型类中的代码
      - 将相关功能放置在同一命名空间中
      - 组织文件夹结构映射命名空间结构

      ### 异步编程
      - 方法名称使用Async后缀
      - 使用Task.ConfigureAwait(false)避免上下文切换
      - 正确传播取消令牌

      ### LINQ使用
      - 优先使用方法语法而非查询语法
      - 避免在循环中重复执行LINQ查询
      - 使用合适的LINQ方法提高可读性',
        '2.3.0',
        'PUBLISHED',
        79,
        'system',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       ('CSS/SCSS 样式指南',
        '现代CSS架构和SCSS预处理器使用指南，包含组件化样式策略',
        '{"subcategory": "frontend"}',
        'css',
        '## CSS/SCSS 样式指南

      ### 命名约定
      - 使用BEM (Block-Element-Modifier)命名方法
      - 使用连字符(-)分隔单词
      - 类名使用小写字母

      ### SCSS使用规范
      - 保持嵌套深度不超过3层
      - 使用变量管理颜色、字体等
      - 使用mixin复用样式块

      ### 样式组织
      - 按组件组织样式文件
      - 使用SCSS模块化导入
      - 避免全局样式污染

      ### 性能考量
      - 避免过度特定的选择器
      - 避免使用!important
      - 使用简写属性减少代码量',
        '2.0.1',
        'PUBLISHED',
        86,
        'system',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP),
       ('Kotlin 编码规范',
        'Kotlin语言最佳实践和编码风格指南',
        '{"subcategory": "backend"}',
        'kotlin',
        '## Kotlin 编码规范

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
      - 利用集合操作符代替手动迭代',
        '1.1.0',
        'DRAFT',
        78,
        'system',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP);
