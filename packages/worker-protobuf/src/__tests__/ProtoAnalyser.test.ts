import { readFileSync } from 'fs';
import { join } from 'path';
import { ProtoAnalyser, DataStructType } from '../ProtoAnalyser';

describe('ProtoAnalyser', () => {
  let protoAnalyser: ProtoAnalyser;
  let protoContent: string;
  const protoFilePath = join(__dirname, 'test.proto');

  beforeEach(() => {
    protoAnalyser = new ProtoAnalyser();
    protoContent = readFileSync(protoFilePath, 'utf-8');
  });

  test('should parse proto content into CodeDataStruct array', () => {
    const result = protoAnalyser.analyseFromContent(protoContent, protoFilePath);
    
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  test('should correctly parse message types', () => {
    const result = protoAnalyser.analyseFromContent(protoContent, protoFilePath);
    
    // 查找 User 消息
    const userMessage = result.find(item => item.NodeName === 'User');
    
    expect(userMessage).toBeDefined();
    expect(userMessage?.Type).toBe(DataStructType.Message);
    expect(userMessage?.Package).toBe('example');
    expect(userMessage?.Fields.length).toBe(8); // 用户有 8 个字段
    
    // 验证字段名称
    const fieldNames = userMessage?.Fields.map(field => field.Name);
    expect(fieldNames).toContain('id');
    expect(fieldNames).toContain('name');
    expect(fieldNames).toContain('age');
    expect(fieldNames).toContain('email');
    expect(fieldNames).toContain('tags');
    expect(fieldNames).toContain('address');
    expect(fieldNames).toContain('type');
    expect(fieldNames).toContain('status');
    
    // 验证数组类型
    const tagsField = userMessage?.Fields.find(field => field.Name === 'tags');
    expect(tagsField?.IsArray).toBe(true);
  });

  test('should correctly parse nested messages', () => {
    const result = protoAnalyser.analyseFromContent(protoContent, protoFilePath);
    
    // 查找 User.Address 嵌套消息
    const addressType = result.find(item => 
      item.NodeName === 'Address' && item.Module.includes('User')
    );
    
    expect(addressType).toBeDefined();
    expect(addressType?.Type).toBe(DataStructType.Message);
    expect(addressType?.Fields.length).toBe(4);  // Address 有 4 个字段
    
    // 验证嵌套字段名称
    const addressFieldNames = addressType?.Fields.map(field => field.Name);
    expect(addressFieldNames).toContain('street');
    expect(addressFieldNames).toContain('city');
    expect(addressFieldNames).toContain('country');
    expect(addressFieldNames).toContain('zip_code');
  });

  test('should correctly parse enum types', () => {
    const result = protoAnalyser.analyseFromContent(protoContent, protoFilePath);
    
    // 查找 UserType 枚举
    const userTypeEnum = result.find(item => 
      item.NodeName === 'UserType' && !item.Module.includes('.')
    );
    
    expect(userTypeEnum).toBeDefined();
    expect(userTypeEnum?.Type).toBe(DataStructType.Enum);
    expect(userTypeEnum?.Fields.length).toBe(3);  // UserType 有 3 个值
    
    // 验证枚举值
    const enumValues = userTypeEnum?.Fields.map(field => field.Name);
    expect(enumValues).toContain('NORMAL');
    expect(enumValues).toContain('ADMIN');
    expect(enumValues).toContain('GUEST');
    
    // 检查嵌套枚举 UserStatus
    const userStatusEnum = result.find(item => 
      item.NodeName === 'UserStatus' && item.Module.includes('User')
    );
    
    expect(userStatusEnum).toBeDefined();
    expect(userStatusEnum?.Type).toBe(DataStructType.Enum);
    expect(userStatusEnum?.Fields.length).toBe(3);  // UserStatus 有 3 个值
    
    // 验证嵌套枚举值
    const nestedEnumValues = userStatusEnum?.Fields.map(field => field.Name);
    expect(nestedEnumValues).toContain('ACTIVE');
    expect(nestedEnumValues).toContain('INACTIVE');
    expect(nestedEnumValues).toContain('SUSPENDED');
  });

  test('should correctly parse service types', () => {
    const result = protoAnalyser.analyseFromContent(protoContent, protoFilePath);
    
    // 查找 UserService 服务
    const userService = result.find(item => item.NodeName === 'UserService');
    
    expect(userService).toBeDefined();
    expect(userService?.Type).toBe(DataStructType.Interface);
    expect(userService?.Functions.length).toBe(5);  // UserService 有 5 个方法
    
    // 验证服务方法
    const methodNames = userService?.Functions.map(func => func.Name);
    expect(methodNames).toContain('GetUser');
    expect(methodNames).toContain('CreateUser');
    expect(methodNames).toContain('UpdateUser');
    expect(methodNames).toContain('DeleteUser');
    expect(methodNames).toContain('ListUsers');
    
    // 验证方法参数和返回类型
    const getUser = userService?.Functions.find(func => func.Name === 'GetUser');
    expect(getUser?.ReturnType).toBe('User');
    expect(getUser?.Parameters[0].Type).toBe('GetUserRequest');
  });

  test('should handle empty content and return empty array', () => {
    const result = protoAnalyser.analyseFromContent('', 'empty.proto');
    expect(result).toEqual([]);
  });

  test('should handle invalid content and return empty array', () => {
    const result = protoAnalyser.analyseFromContent('invalid proto content', 'invalid.proto');
    expect(result).toEqual([]);
  });
});