import { describe, it, expect } from 'vitest';
import { capitalize, sum } from '../src/utils';

describe('Utils', () => {
  describe('capitalize', () => {
    it('应该将字符串首字母大写', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('应该处理空字符串', () => {
      expect(capitalize('')).toBe('');
    });

    it('应该处理已经首字母大写的字符串', () => {
      expect(capitalize('World')).toBe('World');
    });
  });

  describe('sum', () => {
    it('应该计算两个正数的和', () => {
      expect(sum(1, 2)).toBe(3);
    });

    it('应该处理负数', () => {
      expect(sum(-1, 2)).toBe(1);
      expect(sum(1, -2)).toBe(-1);
      expect(sum(-1, -2)).toBe(-3);
    });

    it('应该处理零', () => {
      expect(sum(0, 0)).toBe(0);
      expect(sum(0, 5)).toBe(5);
    });
  });
});
