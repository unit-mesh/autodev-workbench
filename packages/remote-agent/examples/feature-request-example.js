#!/usr/bin/env node

/**
 * FeatureRequestPlaybook 使用示例
 * 展示如何使用优化后的功能请求分析和自动化 PR 生成功能
 */

const { join } = require('node:path')
require('dotenv').config()

async function runFeatureRequestExample() {
  console.log('🚀 FeatureRequestPlaybook 使用示例')
  console.log('=' * 50)

  try {
    // 导入必要的模块
    const { AIAgent } = require('../dist/agent.js')
    const { FeatureRequestPlaybook } = require('../dist/playbooks/index.js')

    // 检查环境配置
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('请设置 GITHUB_TOKEN 环境变量')
    }

    const hasLLM = process.env.GLM_TOKEN || process.env.DEEPSEEK_TOKEN || process.env.OPENAI_API_KEY
    if (!hasLLM) {
      throw new Error('请设置 LLM 提供商的 API 密钥 (GLM_TOKEN, DEEPSEEK_TOKEN, 或 OPENAI_API_KEY)')
    }

    console.log('✅ 环境配置检查通过')

    // 初始化 AI Agent 与 FeatureRequestPlaybook
    const agent = new AIAgent({
      workspacePath: join(process.cwd(), '../../'), // 指向项目根目录
      githubToken: process.env.GITHUB_TOKEN,
      verbose: true, // 启用详细日志
      maxToolRounds: 3, // 最多3轮工具调用
      enableToolChaining: true, // 启用工具链
      playbook: new FeatureRequestPlaybook() // 使用功能请求 Playbook
    })

    const llmInfo = agent.getLLMInfo()
    console.log(`🧠 LLM 提供商: ${llmInfo.provider} (${llmInfo.model})`)
    console.log(`🔧 可用工具: ${agent.getAvailableTools().length} 个`)

    // 示例功能请求
    const featureRequests = [
      {
        title: 'OAuth2 认证系统',
        description: 'Implement OAuth2 authentication system with Google and GitHub providers for secure user login and registration'
      },
      {
        title: 'API 限流功能',
        description: 'Add API rate limiting functionality using Redis to prevent abuse and ensure fair usage across all users'
      },
      {
        title: '实时通知系统',
        description: 'Create real-time notification system using WebSocket for instant user updates and alerts'
      }
    ]

    // 选择要分析的功能请求（可以修改索引来测试不同的请求）
    const selectedRequest = featureRequests[0]
    
    console.log(`\n📋 分析功能请求: ${selectedRequest.title}`)
    console.log(`📝 描述: ${selectedRequest.description}`)
    console.log('\n🤔 开始分析...\n')

    // 执行功能请求分析
    const startTime = Date.now()
    const response = await agent.start(selectedRequest.description)
    const executionTime = Date.now() - startTime

    // 显示分析结果
    console.log('\n' + '=' * 80)
    console.log('📊 分析结果摘要')
    console.log('=' * 80)
    console.log(`✅ 分析状态: ${response.success ? '成功' : '失败'}`)
    console.log(`🔄 执行轮次: ${response.totalRounds || 1}`)
    console.log(`🛠️ 工具调用: ${response.toolResults.length} 次`)
    console.log(`⏱️ 执行时间: ${(executionTime / 1000).toFixed(2)} 秒`)
    console.log(`📝 响应长度: ${response.text.length} 字符`)

    // 显示工具执行详情
    if (response.toolResults.length > 0) {
      console.log('\n🔧 工具执行详情:')
      const toolsByRound = new Map()
      
      response.toolResults.forEach(result => {
        const round = result.round || 1
        if (!toolsByRound.has(round)) {
          toolsByRound.set(round, [])
        }
        toolsByRound.get(round).push(result)
      })

      for (const [round, tools] of toolsByRound) {
        console.log(`\n  📍 第 ${round} 轮:`)
        tools.forEach((result, i) => {
          const status = result.success ? '✅' : '❌'
          const time = result.executionTime ? ` (${result.executionTime}ms)` : ''
          console.log(`    ${i + 1}. ${result.functionCall.name}${time} ${status}`)
        })
      }
    }

    // 显示完整的分析报告
    console.log('\n' + '=' * 80)
    console.log('📄 功能请求分析报告')
    console.log('=' * 80)
    console.log(response.text)

    // 分析报告质量检查
    console.log('\n' + '=' * 80)
    console.log('🔍 报告质量分析')
    console.log('=' * 80)
    
    const text = response.text.toLowerCase()
    const qualityChecks = {
      '需求分析': text.includes('requirement') || text.includes('feature') || text.includes('需求'),
      '技术分析': text.includes('technical') || text.includes('implementation') || text.includes('技术'),
      '实现计划': text.includes('plan') || text.includes('step') || text.includes('计划'),
      '代码示例': text.includes('code') || text.includes('```') || text.includes('代码'),
      '测试策略': text.includes('test') || text.includes('测试'),
      '文档要求': text.includes('documentation') || text.includes('文档')
    }

    Object.entries(qualityChecks).forEach(([check, passed]) => {
      console.log(`  ${check}: ${passed ? '✅' : '❌'}`)
    })

    const qualityScore = Object.values(qualityChecks).filter(Boolean).length
    console.log(`\n📊 报告质量评分: ${qualityScore}/6 (${(qualityScore/6*100).toFixed(1)}%)`)

    // 提供后续建议
    console.log('\n' + '=' * 80)
    console.log('🎯 后续建议')
    console.log('=' * 80)
    
    if (response.success && qualityScore >= 4) {
      console.log('✅ 分析质量良好，可以开始实施:')
      console.log('  1. 根据分析报告创建详细的开发任务')
      console.log('  2. 设置开发环境和依赖')
      console.log('  3. 按照实现计划逐步开发')
      console.log('  4. 实施测试策略确保质量')
      console.log('  5. 准备文档和部署计划')
    } else {
      console.log('⚠️ 分析需要改进:')
      if (qualityScore < 4) {
        console.log('  - 分析深度不足，建议重新运行或调整提示词')
      }
      if (!response.success) {
        console.log('  - 执行过程中出现错误，请检查日志')
      }
      console.log('  - 考虑提供更详细的功能需求描述')
      console.log('  - 确保项目上下文信息充分')
    }

    console.log('\n🎉 示例执行完成!')
    
    return response.success

  } catch (error) {
    console.error('❌ 示例执行失败:', error.message)
    if (error.stack) {
      console.error('错误堆栈:', error.stack)
    }
    return false
  }
}

// 主函数
if (require.main === module) {
  runFeatureRequestExample()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ 致命错误:', error)
      process.exit(1)
    })
}

module.exports = { runFeatureRequestExample }
