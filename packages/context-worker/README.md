# AutoDev Context Worker

- 深度项目解析与 AST 构建结构化，Context Worker 对整个项目（或指定的模块范围）进行深度解析。这包括构建完整的 AST，识别所有的函数、类、接口及其签名、注释（docstrings）。同时，分析项目依赖（内部模块间和外部库依赖），构建初步的依赖图。
- 自动化代码摘要与“意图”标注：对于缺乏良好注释的代码块（函数、复杂逻辑段），尝试使用 LLM 预先生成简洁的摘要或“意图描述”。对于一些关键的架构组件或核心算法，可以预先打上特定的标签或元数据。
- 构建项目级知识图谱：将解析出的代码实体（类、函数、变量等）及其关系（调用、继承、实现、引用等），并围绕领域模型构建知识图谱， 标注实体的语义和上下文信息。
- ……

### AutoDev Context Worker

AutoDev Context Worker 是一个用于深度解析和分析代码的工具，旨在为开发者提供更好的上下文理解和智能化的代码处理能力。它可以帮助开发者更高效地理解和使用代码库。

```bash
npx @autodev/context-worker@latest
```

示例：

```yaml
TITLE: Implementing Action Behavior in Java
DESCRIPTION: Shows the structure of the AnAction.actionPerformed() method where the main logic of an action is implemented. It demonstrates how to access project, editor, and file information from the action event.
SOURCE: https://github.com/JetBrains/intellij-sdk-docs/blob/main/topics/basics/action_system.md#2025-04-06_snippet_1
LANGUAGE: Java
CODE: |
    public void actionPerformed(AnActionEvent e) {
    // ...
    }
```
