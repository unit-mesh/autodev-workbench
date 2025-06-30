/**
 * 工具函数
 */
/**
 * 延迟函数
 */
export declare function delay(ms: number): Promise<void>;
/**
 * 深度合并对象
 */
export declare function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T;
/**
 * 安全的JSON解析
 */
export declare function safeJsonParse<T = any>(jsonString: string, defaultValue?: T | null): T | null;
/**
 * 格式化文件大小
 */
export declare function formatFileSize(bytes: number): string;
/**
 * 格式化持续时间
 */
export declare function formatDuration(ms: number): string;
/**
 * 生成唯一ID
 */
export declare function generateId(prefix?: string): string;
/**
 * 检查文件是否存在
 */
export declare function fileExists(filePath: string): Promise<boolean>;
/**
 * 确保目录存在
 */
export declare function ensureDir(dirPath: string): Promise<void>;
/**
 * 安全地读取文件
 */
export declare function safeReadFile(filePath: string, encoding?: BufferEncoding): Promise<string | null>;
/**
 * 安全地写入文件
 */
export declare function safeWriteFile(filePath: string, content: string, encoding?: BufferEncoding): Promise<boolean>;
/**
 * 获取文件扩展名
 */
export declare function getFileExtension(filePath: string): string;
/**
 * 检查是否为代码文件
 */
export declare function isCodeFile(filePath: string): boolean;
/**
 * 检查是否为配置文件
 */
export declare function isConfigFile(filePath: string): boolean;
/**
 * 清理路径
 */
export declare function cleanPath(filePath: string): string;
/**
 * 获取相对路径
 */
export declare function getRelativePath(from: string, to: string): string;
/**
 * 限制字符串长度
 */
export declare function truncateString(str: string, maxLength: number, suffix?: string): string;
/**
 * 移除字符串中的ANSI颜色代码
 */
export declare function stripAnsiColors(str: string): string;
/**
 * 解析版本号
 */
export declare function parseVersion(version: string): {
    major: number;
    minor: number;
    patch: number;
} | null;
/**
 * 比较版本号
 */
export declare function compareVersions(version1: string, version2: string): number;
/**
 * 检查版本是否兼容
 */
export declare function isVersionCompatible(currentVersion: string, targetVersion: string): boolean;
/**
 * 创建备份文件名
 */
export declare function createBackupFileName(filePath: string, timestamp?: number): string;
/**
 * 计算文件哈希（简化版）
 */
export declare function simpleHash(content: string): string;
/**
 * 检查是否为空目录
 */
export declare function isEmptyDirectory(dirPath: string): Promise<boolean>;
/**
 * 递归删除空目录
 */
export declare function removeEmptyDirectories(dirPath: string): Promise<void>;
/**
 * 获取环境变量，支持默认值
 */
export declare function getEnvVar(name: string, defaultValue?: string): string | undefined;
/**
 * 检查是否为开发环境
 */
export declare function isDevelopment(): boolean;
/**
 * 检查是否为生产环境
 */
export declare function isProduction(): boolean;
/**
 * 创建进度条字符串
 */
export declare function createProgressBar(progress: number, width?: number): string;
/**
 * 防抖函数
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * 节流函数
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=index.d.ts.map