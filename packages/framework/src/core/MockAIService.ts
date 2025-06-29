/**
 * 模拟AI服务 - 用于测试和演示
 */

import { AIService } from './AIService';
import { AIServiceConfig } from '../types';

export class MockAIService extends AIService {
  constructor(config: AIServiceConfig = {}) {
    super({
      provider: 'mock',
      model: 'mock-gpt',
      ...config
    });
  }

  protected checkAvailability(): boolean {
    // 模拟服务总是可用
    return true;
  }

  protected async performAICall(prompt: string, options: any): Promise<string> {
    // 模拟API调用延迟
    await this.delay(500 + Math.random() * 1000);

    // 根据提示词类型生成模拟响应
    return this.generateMockResponse(prompt, options);
  }

  private generateMockResponse(prompt: string, options: any): string {
    const promptLower = prompt.toLowerCase();

    // 项目分析响应
    if (promptLower.includes('分析') && promptLower.includes('项目')) {
      return JSON.stringify({
        complexity: 'medium',
        risks: [
          {
            type: 'dependency',
            severity: 'medium',
            description: '部分依赖可能需要升级',
            files: ['package.json'],
            mitigation: '使用npm update升级依赖'
          }
        ],
        recommendations: [
          {
            category: 'dependency',
            priority: 'high',
            description: '建议先升级核心依赖',
            action: '运行 npm update vue@latest'
          },
          {
            category: 'code',
            priority: 'medium',
            description: '建议使用Composition API重构组件',
            action: '逐步迁移到 <script setup> 语法'
          }
        ],
        estimatedEffort: {
          hours: 8,
          confidence: 'medium'
        }
      }, null, 2);
    }

    // 依赖分析响应
    if (promptLower.includes('依赖') && promptLower.includes('兼容性')) {
      return JSON.stringify({
        incompatible: [
          {
            name: 'vue-template-compiler',
            currentVersion: '^2.6.14',
            reason: 'Vue 3不再需要此依赖',
            alternatives: ['@vue/compiler-sfc']
          }
        ],
        upgrades: [
          {
            name: 'vue',
            currentVersion: '^2.6.14',
            targetVersion: '^3.3.0',
            breakingChanges: [
              'Global API changes',
              'Template directive changes',
              'Component lifecycle changes'
            ],
            migrationGuide: 'https://v3-migration.vuejs.org/'
          }
        ],
        risks: [
          {
            dependency: 'vue-router',
            risk: '需要从v3升级到v4',
            impact: '路由配置语法有变化'
          }
        ]
      }, null, 2);
    }

    // 文件分析响应
    if (promptLower.includes('文件') && promptLower.includes('迁移需求')) {
      return JSON.stringify({
        needsMigration: true,
        issues: [
          {
            line: 15,
            type: 'deprecated-api',
            description: '使用了已废弃的 $listeners',
            suggestion: '使用 $attrs 替代'
          },
          {
            line: 28,
            type: 'syntax-change',
            description: 'v-model 语法需要更新',
            suggestion: '使用新的 v-model 语法'
          }
        ],
        complexity: 'medium',
        estimatedTime: '30分钟'
      }, null, 2);
    }

    // 代码修复响应
    if (promptLower.includes('修复') && promptLower.includes('代码')) {
      // 生成修复后的代码示例
      if (prompt.includes('vue')) {
        return `<template>
  <div class="app">
    <h1>{{ title }}</h1>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('Vue 3 App')
const count = ref(0)

const increment = () => {
  count.value++
}
</script>

<style scoped>
.app {
  text-align: center;
  margin-top: 60px;
}
</style>`;
      }

      if (prompt.includes('react')) {
        return `import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>React 18 App</h1>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}

export default App;`;
      }
    }

    // 代码验证响应
    if (promptLower.includes('验证') && promptLower.includes('代码')) {
      return JSON.stringify({
        valid: true,
        errors: [],
        warnings: [
          '建议添加TypeScript类型注解',
          '考虑使用更具语义的变量名'
        ],
        suggestions: [
          '可以使用computed属性优化性能',
          '建议添加错误边界处理'
        ],
        score: 85
      }, null, 2);
    }

    // 默认响应
    return `基于您的请求，我建议：

1. 首先备份当前项目
2. 逐步升级依赖包
3. 使用自动化工具进行代码转换
4. 手动修复复杂的兼容性问题
5. 运行测试确保功能正常

这是一个模拟的AI响应，实际使用时会连接到真实的AI服务。`;
  }

  // 重写统计方法以包含模拟信息
  public getStats(): any {
    const baseStats = super.getStats();
    return {
      ...baseStats,
      provider: 'mock',
      note: '这是模拟AI服务的统计信息'
    };
  }
}
