import { NextRequest, NextResponse } from "next/server";
import { reply } from "@/app/api/_utils/reply";

export async function POST(request: NextRequest) {
  try {
    const { step, data } = await request.json();
    
    if (!step) {
      return NextResponse.json(
        { error: "Missing step parameter" },
        { status: 400 }
      );
    }
    
    let prompt = "";
    let content = "";
    
    switch (step) {
      case "intent-recognition":
        prompt = `你是一个需求分析助手。请分析用户的需求描述，提取以下信息：
1. 主要意图（用户想要做什么）
2. 关键词（与需求相关的重要术语）
3. 置信度（你对理解正确的把握程度，0.0-1.0）

以JSON格式返回结果：
{
  "intent": "主要意图",
  "keywords": ["关键词1", "关键词2"],
  "confidence": 0.95,
  "summary": "对用户需求的简短总结"
}`;
        content = data.requirement || "";
        break;
        
      case "clarifying-questions":
        prompt = `基于用户的需求描述和以下背景信息，生成4-5个澄清问题，以便更好地定义需求：
背景信息：${JSON.stringify(data.intentInfo)}

以JSON格式返回结果：
{
  "prompts": [
    "问题1？",
    "问题2？",
    "问题3？",
    "问题4？"
  ]
}`;
        content = data.requirement || "";
        break;
        
      case "asset-recommendation":
        prompt = `基于用户的需求和回答，推荐可能有用的资源。
需求：${data.initialRequirement}
澄清问题的回答：${data.clarification}

以JSON格式返回三类资源：
{
  "apis": [
    {"id": "api1", "name": "ExcelExportAPI", "description": "Excel导出接口", "example": "示例代码片段"}
  ],
  "codeSnippets": [
    {"id": "code1", "name": "导出功能示例", "language": "TypeScript", "code": "示例代码", "description": "实现Excel导出的代码片段"}
  ],
  "standards": [
    {"id": "std1", "name": "数据导出规范", "description": "公司关于数据导出功能的开发规范"}
  ]
}`;
        content = `需求: ${data.initialRequirement}\n回答: ${data.clarification}`;
        break;
        
      case "requirement-card":
        prompt = `根据用户需求和选择的资源，生成一个完整的需求卡片。
需求：${data.initialRequirement}
澄清问题的回答：${data.clarification}
选择的API：${JSON.stringify(data.selectedApis)}
选择的代码片段：${JSON.stringify(data.selectedCodeSnippets)}
选择的标准：${JSON.stringify(data.selectedStandards)}

以JSON格式返回需求卡片：
{
  "name": "功能名称",
  "module": "所属模块",
  "description": "功能详细描述",
  "assignee": "",
  "deadline": "",
  "status": "draft"
}`;
        content = `生成需求卡片: ${data.initialRequirement}`;
        break;
        
      default:
        return NextResponse.json(
          { error: "Invalid step parameter" },
          { status: 400 }
        );
    }
    
    const result = await reply([
      { role: "system", content: prompt },
      { role: "user", content }
    ]);
    
    return NextResponse.json({ text: result });
  } catch (error) {
    console.error("Error in requirement API:", error);
    return NextResponse.json(
      { error: "Failed to process requirement" },
      { status: 500 }
    );
  }
}
