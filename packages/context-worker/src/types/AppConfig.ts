/**
 * 应用程序统一配置接口
 */
export interface AppConfig {
  /** 要扫描的目录路径 */
  dirPath: string;
  /** 是否上传分析结果到服务器 */
  upload: boolean;
  /** 服务器地址 */
  baseUrl: string;
  /** 学习材料输出目录 */
  outputDir: string;
  /** 是否使用非交互模式 */
  nonInteractive: boolean;
  /** 要处理的上下文类型 */
  contextType: 'api' | 'interface';
  /** JSON 结果输出文件名 */
  outputJsonFile?: string;
  /** 项目 ID */
  projectId?: string;
}

/**
 * 应用程序默认配置
 */
export const DEFAULT_CONFIG: AppConfig = {
  dirPath: process.cwd(),
  upload: false,
  baseUrl: 'http://localhost:3000/',
  outputDir: 'materials',
  nonInteractive: false,
  contextType: 'api',
  outputJsonFile: 'analysis_result.json',
  projectId: undefined
};
