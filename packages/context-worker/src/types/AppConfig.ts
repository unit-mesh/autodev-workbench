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
  /** JSON 结果输出文件名 */
  outputJsonFile?: string;
}

/**
 * 应用程序默认配置
 */
export const DEFAULT_CONFIG: AppConfig = {
  dirPath: process.cwd(),
  upload: false,
  baseUrl: 'http://localhost:3000/api/context',
  outputDir: 'materials',
  nonInteractive: false,
  outputJsonFile: 'analysis_result.json'
};
