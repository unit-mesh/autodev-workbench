import { CodeBlock } from "../CodeAnalysisResult";

/**
 * 用于检查和合并Markdown代码块上下文交叉的工具类
 */
export class CodeBlockContextMerger {
  /**
   * 处理同一文件中可能存在上下文交叉的代码块
   * @param codeBlocks 来自同一Markdown文件的代码块数组
   * @param contextLines 考虑的上下文行数（默认20行）
   * @returns 处理后的代码块数组
   */
  public static processOverlappingContexts(
    codeBlocks: CodeBlock[],
    contextLines: number = 20
  ): CodeBlock[] {
    if (codeBlocks.length <= 1) {
      return codeBlocks;
    }
    
    // 按照在文件中的出现位置排序代码块
    const sortedBlocks = this.sortBlocksByPosition(codeBlocks);
    const result: CodeBlock[] = [];
    
    // 用于跟踪正在处理的代码块组
    let currentGroup: CodeBlock[] = [sortedBlocks[0]];
    
    for (let i = 1; i < sortedBlocks.length; i++) {
      const currentBlock = sortedBlocks[i];
      const previousBlock = currentGroup[currentGroup.length - 1];
      
      // 检查当前块与上一个块是否存在上下文交叉
      if (this.hasContextOverlap(previousBlock, currentBlock, contextLines)) {
        // 如果有交叉，将当前块加入到当前组
        currentGroup.push(currentBlock);
      } else {
        // 如果没有交叉，处理当前组并开始一个新组
        if (currentGroup.length > 1) {
          result.push(this.mergeCodeBlocks(currentGroup));
        } else {
          result.push(currentGroup[0]);
        }
        currentGroup = [currentBlock];
      }
    }
    
    // 处理最后一组
    if (currentGroup.length > 1) {
      result.push(this.mergeCodeBlocks(currentGroup));
    } else if (currentGroup.length === 1) {
      result.push(currentGroup[0]);
    }
    
    return result;
  }
  
  /**
   * 检查两个代码块的上下文是否存在交叉
   */
  private static hasContextOverlap(
    block1: CodeBlock,
    block2: CodeBlock,
    contextLines: number
  ): boolean {
    // 首先检查是否在同一个文件中
    if (block1.filePath !== block2.filePath) {
      return false;
    }

    // 检查是否是同一个代码段的不同部分（基于代码内容）
    const codeOverlap = this.checkCodeOverlap(block1.code, block2.code);
    if (codeOverlap) {
      return true;
    }

    // 如果代码不同，检查上下文是否有交叉
    if (block1.context.after && block2.context.before) {
      // 截取限定行数的上下文
      const block1AfterLines = block1.context.after.split('\n').slice(0, contextLines);
      const block2BeforeLines = block2.context.before.split('\n').slice(-contextLines);
      
      // 检查上下文中是否有连续相同的行
      const minLinesForOverlap = Math.min(3, Math.floor(contextLines / 6));
      let consecutiveMatchCount = 0;
      
      for (let i = 0; i < block1AfterLines.length; i++) {
        const line1 = block1AfterLines[i].trim();
        if (!line1) continue;
        
        for (let j = 0; j < block2BeforeLines.length; j++) {
          const line2 = block2BeforeLines[j].trim();
          if (!line2 || line1 !== line2) continue;
          
          // 找到一行匹配，检查是否有连续的匹配行
          let k = 1;
          while (
            i + k < block1AfterLines.length && 
            j + k < block2BeforeLines.length && 
            block1AfterLines[i + k].trim() === block2BeforeLines[j + k].trim()
          ) {
            k++;
          }
          
          consecutiveMatchCount = Math.max(consecutiveMatchCount, k);
          if (consecutiveMatchCount >= minLinesForOverlap) {
            return true;
          }
        }
      }
      
      // 另一个判断：如果两个上下文的头尾有明显重叠
      const block1Tail = block1AfterLines.slice(-minLinesForOverlap).join('\n').trim();
      const block2Head = block2BeforeLines.slice(0, minLinesForOverlap).join('\n').trim();
      
      if (block1Tail && block2Head && (block1Tail === block2Head)) {
        return true;
      }
    }
    
    // 检查两个块是否由同一个标题下或属于同一个逻辑部分
    if (block1.heading && block2.heading && block1.heading === block2.heading) {
      // 如果在同一个标题下，且相距不远，可能属于同一上下文
      // 这里的判断可以基于在原始文档中的位置（如果有这个信息）
      return true;
    }
    
    return false;
  }
  
  /**
   * 检查两个代码块是否有代码重叠（可能是同一段代码的不同部分）
   */
  private static checkCodeOverlap(code1: string, code2: string): boolean {
    if (!code1 || !code2) return false;
    
    // 如果其中一个代码完全包含另一个，认为有重叠
    if (code1.includes(code2) || code2.includes(code1)) {
      return true;
    }
    
    // 拆分为行进行比较
    const lines1 = code1.split('\n');
    const lines2 = code2.split('\n');
    
    // 计算有多少行是相同的
    const commonLines = lines1.filter(line => 
      lines2.some(l2 => l2.trim() === line.trim() && line.trim().length > 0)
    );
    
    // 如果相同行数占比超过30%，认为它们可能是相关的
    const overlapRatio = commonLines.length / Math.min(lines1.length, lines2.length);
    return overlapRatio > 0.3;
  }
  
  /**
   * 合并一组有上下文交叉的代码块
   */
  private static mergeCodeBlocks(blocks: CodeBlock[]): CodeBlock {
    if (blocks.length === 1) return blocks[0];
    
    // 获取第一个和最后一个块作为合并范围
    const firstBlock = blocks[0];
    const lastBlock = blocks[blocks.length - 1];
    
    // 创建一个新的合并后的代码块
    const mergedBlock: CodeBlock = {
      ...firstBlock,
      heading: firstBlock.heading || lastBlock.heading,
      code: blocks.map(b => b.code).join('\n\n// ...\n\n'),
      context: {
        before: firstBlock.context.before,
        after: lastBlock.context.after
      }
    };
    
    return mergedBlock;
  }
  
  /**
   * 根据代码块在文件中的位置排序
   * 这里简化实现，假设代码块已经按照它们在文件中的顺序提供
   */
  private static sortBlocksByPosition(blocks: CodeBlock[]): CodeBlock[] {
    // 实际情况下，你可能需要解析更多信息来确定精确位置
    return [...blocks];
  }
}
