/**
 * 基本使用示例
 */

const {
  createMigrationOrchestrator,
  createMigrationContext,
  createMockAIService,
  createToolExecutor,
  AnalysisAgent,
  FixAgent,
  ValidationAgent,
  ConfigManager
} = require('../lib/index.js');

async function basicMigrationExample() {
  console.log('🚀 开始基本迁移示例');
  
  try {
    // 1. 创建配置管理器
    const configManager = new ConfigManager({
      mode: 'auto',
      verbose: true,
      dryRun: true // 演示模式
    });
    
    // 2. 创建迁移编排器
    const orchestrator = createMigrationOrchestrator({
      verbose: true,
      dryRun: true
    });
    
    // 3. 初始化迁移上下文
    const projectPath = process.cwd();
    const context = await orchestrator.initialize(projectPath, {
      preset: 'vue2-to-vue3'
    });
    
    // 4. 设置事件监听
    orchestrator.on('phase:change', (data) => {
      console.log(`📍 阶段变更: ${data.phase}`);
    });
    
    orchestrator.on('progress:update', (progress) => {
      console.log(`📊 进度: ${progress}%`);
    });
    
    // 5. 执行迁移
    const result = await orchestrator.execute();
    
    console.log('✅ 迁移完成');
    console.log('结果摘要:', result.summary);
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
  }
}

async function customAIAgentExample() {
  console.log('🤖 开始自定义AI代理示例');
  
  try {
    // 1. 创建迁移上下文
    const context = createMigrationContext('./test-project', {
      verbose: true
    });
    
    // 2. 创建模拟AI服务
    const aiService = createMockAIService({
      verbose: true
    });
    
    // 3. 创建工具执行器
    const toolExecutor = createToolExecutor(context, {
      verbose: true
    });
    await toolExecutor.initialize();
    
    // 4. 创建AI代理
    const analysisAgent = new AnalysisAgent(context, aiService, toolExecutor);
    const fixAgent = new FixAgent(context, aiService, toolExecutor);
    const validationAgent = new ValidationAgent(context, aiService, toolExecutor);
    
    // 5. 执行分析
    console.log('📋 执行项目分析...');
    const analysisResult = await analysisAgent.execute();
    console.log('分析完成:', analysisResult.analysis?.complexity);
    
    // 6. 执行修复
    console.log('🔧 执行代码修复...');
    const fixResult = await fixAgent.execute();
    console.log('修复完成:', `${fixResult.fixedFiles} 个文件`);
    
    // 7. 执行验证
    console.log('✅ 执行结果验证...');
    const validationResult = await validationAgent.execute();
    console.log('验证完成:', `总分 ${validationResult.summary.score}`);
    
    console.log('🎉 自定义AI代理示例完成');
    
  } catch (error) {
    console.error('❌ 自定义代理示例失败:', error.message);
  }
}

async function configurationExample() {
  console.log('⚙️  开始配置管理示例');
  
  try {
    // 1. 创建配置管理器
    const configManager = new ConfigManager();
    
    // 2. 查看默认配置
    console.log('默认配置:', configManager.getConfigSummary());
    
    // 3. 查看可用预设
    const presets = configManager.getAllPresets();
    console.log('可用预设:');
    for (const [name, preset] of presets) {
      console.log(`  - ${name}: ${preset.description}`);
    }
    
    // 4. 获取特定预设
    const vuePreset = configManager.getPreset('vue2-to-vue3');
    if (vuePreset) {
      console.log('Vue预设步骤:');
      vuePreset.steps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step.name} (${step.required ? '必需' : '可选'})`);
      });
    }
    
    // 5. 验证配置
    const validation = configManager.validateConfig();
    console.log('配置验证:', validation.valid ? '通过' : '失败');
    if (!validation.valid) {
      console.log('错误:', validation.errors);
    }
    
    console.log('⚙️  配置管理示例完成');
    
  } catch (error) {
    console.error('❌ 配置示例失败:', error.message);
  }
}

// 主函数
async function main() {
  const example = process.argv[2] || 'basic';
  
  console.log('🌟 AI迁移框架示例');
  console.log(`运行示例: ${example}\n`);
  
  switch (example) {
    case 'basic':
      await basicMigrationExample();
      break;
    case 'agents':
      await customAIAgentExample();
      break;
    case 'config':
      await configurationExample();
      break;
    case 'all':
      await basicMigrationExample();
      console.log('\n' + '='.repeat(50) + '\n');
      await customAIAgentExample();
      console.log('\n' + '='.repeat(50) + '\n');
      await configurationExample();
      break;
    default:
      console.log('可用示例:');
      console.log('  basic  - 基本迁移示例');
      console.log('  agents - 自定义AI代理示例');
      console.log('  config - 配置管理示例');
      console.log('  all    - 运行所有示例');
      console.log('\n使用方法: node examples/basic-usage.js [示例名称]');
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('💥 未捕获的异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  basicMigrationExample,
  customAIAgentExample,
  configurationExample
};
