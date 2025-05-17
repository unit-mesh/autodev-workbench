import { type NextRequest, NextResponse } from "next/server"
import "globalthis/polyfill";

// 声明模拟函数类型
type CutForSearchFunc = (text: string, useSimple?: boolean) => string[];
type LoadFunc = () => void;

// 标记jieba是否已经加载
let jiebaLoaded = false;

// 定义模拟jieba对象
let cutForSearch: CutForSearchFunc = (text) => {
  // 简单的分词降级方案
  return text.split(/\s+/).filter(word => word.length >= 2);
};
let load: LoadFunc = () => { 
  jiebaLoaded = true; // 即使是模拟函数，也标记为已加载
};

// 尝试导入nodejieba，如果失败则使用模拟函数
try {
  // 动态导入nodejieba，避免构建时直接加载二进制模块
  if (process.env.NODE_ENV !== 'production') {
    // 使用动态导入替代require
    import("nodejieba").then((nodejieba) => {
      cutForSearch = nodejieba.cutForSearch;
      load = nodejieba.load;
      // 如果导入成功，就立即初始化
      try {
        load();
        jiebaLoaded = true;
        console.log('nodejieba模块加载成功并初始化完成');
      } catch (error) {
        console.warn('nodejieba初始化失败:', error);
        jiebaLoaded = true; // 即使初始化失败，也标记为已尝试加载
      }
    }).catch((error) => {
      console.warn('nodejieba模块动态导入失败，使用简易分词功能代替:', error);
      jiebaLoaded = true; // 导入失败时，也标记为已尝试加载
    });
  } else {
    console.warn('在生产环境中使用模拟jieba分词功能');
    jiebaLoaded = true; // 在生产环境中，标记为已加载
  }
} catch (error) {
  console.warn('nodejieba模块加载失败，使用简易分词功能代替:', error);
  jiebaLoaded = true; // 加载失败时，也标记为已尝试加载
}

async function initJieba() {
  // 如果已加载，直接返回
  if (jiebaLoaded) return;
  
  // 等待一小段时间，以便动态导入完成
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  // 如果动态导入仍在进行中，则标记为已加载，使用模拟功能
  if (!jiebaLoaded) {
    console.warn('等待nodejieba加载超时，使用简易分词功能');
    jiebaLoaded = true;
  }
}

async function extractConcepts(code: string): Promise<string[]> {
  try {
    // 确保jieba已初始化
    if (!jiebaLoaded) {
      await initJieba();
    }

    const classRegex = /class\s+(\w+)/g
    const classes = Array.from(code.matchAll(classRegex)).map((match) => match[1])

    const methodRegex = /(?:async\s+)?(\w+)\s*\(/g
    const methods = Array.from(code.matchAll(methodRegex))
      .map((match) => match[1])
      .filter((method) => !["if", "for", "while", "switch"].includes(method))

    const commentRegex = /\/\*\*([\s\S]*?)\*\/|\/\/(.*)/g
    const comments: string = Array.from(code.matchAll(commentRegex))
      .map((match) => match[1] || match[2])
      .join(" ")

    const words = comments
      .split(/\s+/)
      .map((word) => word.replace(/[^\w]/g, ""))
      .filter((word) => word.length > 4)
      .filter((word) => !["param", "return", "function", "class", "method"].includes(word.toLowerCase()))

    // 使用自定义分词或jieba分词
    let result: string[] = [];
    try {
      result = cutForSearch(comments, false).filter((word) => word.length >= 2);
    } catch (error) {
      console.warn('使用jieba分词失败，回退到简单分词:', error);
      result = comments.split(/\s+/).filter(word => word.length >= 2);
    }

    const allConcepts = [...classes, ...methods, ...words, ...result]
    const uniqueConcepts = Array.from(new Set(allConcepts))

    return uniqueConcepts.sort((a, b) => a.length - b.length)
  } catch (error) {
    console.error('提取概念时出错:', error);
    // 返回尽可能从代码中提取的内容
    const basicExtract = code.split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !/[^\w]/.test(word));
    return Array.from(new Set(basicExtract));
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return NextResponse.json(
        { error: "Invalid request. Concepts array and codeContext are required." },
        { status: 400 },
      )
    }

    const extractResults = await extractConcepts(code)
    return NextResponse.json(extractResults)
  } catch (error) {
    console.error("Error in validate-concepts API:", error)
    return NextResponse.json({ error: "Failed to validate concepts" }, { status: 500 })
  }
}
