#!/usr/bin/env node

/**
 * 本地测试脚本
 * 用于在提交到 GitHub 之前进行本地测试
 */

const { analyzeIssue, validateConfig } = require('../dist/index.js');

async function testLocal() {
  console.log('🧪 开始本地测试...');

  // 1. 验证配置
  console.log('\n1️⃣ 验证配置...');
  const validation = validateConfig();
  if (!validation.valid) {
    console.error('❌ 配置验证失败:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
    return;
  }
  console.log('✅ 配置验证通过');

  // 2. 测试分析功能（如果有 GitHub token）
  if (process.env.GITHUB_TOKEN) {
    console.log('\n2️⃣ 测试 Issue 分析功能...');
    
    try {
      // 这里使用一个示例 issue，你可以替换为实际的 issue
      const result = await analyzeIssue({
        owner: 'unit-mesh',
        repo: 'autodev-worker',
        issueNumber: 1, // 替换为实际存在的 issue 编号
        depth: 'shallow', // 使用浅层分析以节省时间
        autoComment: false, // 本地测试不添加评论
        autoLabel: false // 本地测试不添加标签
      });

      if (result.success) {
        console.log('✅ Issue 分析成功');
        console.log(`⏱️ 执行时间: ${result.executionTime}ms`);
        if (result.analysisResult) {
          console.log('📊 分析结果已生成');
        }
      } else {
        console.error('❌ Issue 分析失败:', result.error);
      }
    } catch (error) {
      console.error('❌ 分析过程中出错:', error.message);
    }
  } else {
    console.log('\n2️⃣ 跳过 Issue 分析测试 (需要 GITHUB_TOKEN)');
  }

  console.log('\n🎉 本地测试完成');
}

// 运行测试
testLocal().catch(error => {
  console.error('💥 测试失败:', error);
  process.exit(1);
});
