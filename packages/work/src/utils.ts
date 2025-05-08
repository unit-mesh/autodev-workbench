/**
 * 将字符串首字母大写
 */
export function capitalize(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 计算两个数字之和
 */
export function sum(a: number, b: number): number {
  return a + b;
}
