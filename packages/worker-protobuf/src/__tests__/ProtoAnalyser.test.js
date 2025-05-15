const { readFileSync } = require('fs');
const { join } = require('path');
const { ProtoAnalyser } = require('../ProtoAnalyser');

describe('ProtoAnalyser', () => {
  test('should parse proto content into CodeDataStruct array', () => {
    // 初始化
    const protoAnalyser = new ProtoAnalyser();
    const protoFilePath = join(__dirname, 'test.proto');
    const protoContent = readFileSync(protoFilePath, 'utf-8');
    
    // 执行测试
    const result = protoAnalyser.analyseFromContent(protoContent, protoFilePath);
    
    // 断言
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
