import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { CoreMessage, generateText } from "ai";
import { configureLLMProvider } from "../../services/llm";

// 定义记忆类别
const MEMORY_CATEGORIES = [
	"Core Functionality",
	"Build & Release Process",
	"Tool Execution Context",
	"Database Connection Issues",
	"Optimization",
	"Testing",
	"User Preferences",
	"Architecture Design",
	"Integration Issues"
];

// 简化的内存工具，专注于对话摘要功能
export const installProjectMemoryTool: ToolLike = (installer) => {
	installer("project-memory", "保存对话摘要到 memories.md 文件", {
		conversation_history: z.array(z.any()).describe("对话历史记录，用于生成摘要")
	}, async ({ conversation_history }) => {
		try {
			if (!conversation_history || conversation_history.length === 0) {
				return {
					content: [{
						type: "text",
						text: "错误：需要提供对话历史记录"
					}]
				};
			}

			const workspacePath = process.env.WORKSPACE_PATH || process.cwd();
			const memoryDir = path.join(workspacePath, ".autodev");
			const markdownPath = path.join(workspacePath, "memories.md");

			if (!fs.existsSync(memoryDir)) {
				fs.mkdirSync(memoryDir, { recursive: true });
			}

			// 读取现有的 memories.md 文件（如果存在）
			let existingMemories = "";
			if (fs.existsSync(markdownPath)) {
				existingMemories = fs.readFileSync(markdownPath, 'utf8');
			}

			// 生成摘要和类别
			const { summary, category } = await generateSummaryWithCategory(conversation_history, existingMemories);

			// 格式化为新的记忆条目
			const newMemoryEntry = formatMemoryEntry(summary, category);

			// 将新记忆添加到文件
			if (fs.existsSync(markdownPath)) {
				// 查找类别标题
				const categoryRegex = new RegExp(`# ${category}`, 'i');
				if (existingMemories.match(categoryRegex)) {
					// 如果类别已存在，在该类别下添加新条目
					const updatedContent = existingMemories.replace(
						categoryRegex,
						`# ${category}\n${newMemoryEntry}`
					);
					fs.writeFileSync(markdownPath, updatedContent);
				} else {
					// 如果类别不存在，添加新类别和条目
					fs.appendFileSync(markdownPath, `\n\n# ${category}\n${newMemoryEntry}`);
				}
			} else {
				// 创建新文件
				fs.writeFileSync(markdownPath, `# ${category}\n${newMemoryEntry}`);
			}

			return {
				content: [{
					type: "text",
					text: `✅ 对话摘要已保存到 ${markdownPath} 的 "${category}" 类别下`
				}]
			};
		} catch (error: any) {
			return {
				content: [{
					type: "text",
					text: `保存对话摘要时出错: ${error.message}`
				}]
			};
		}
	});
};

// 使用 LLM 生成对话摘要和确定适合的类别
async function generateSummaryWithCategory(conversationHistory: any[], existingMemories: string): Promise<{ summary: string, category: string }> {
	const llmConfig = configureLLMProvider();
	if (!llmConfig) {
		throw new Error('未配置 LLM 提供者');
	}

	// 构建提示
	const summaryPrompt = `分析并总结以下对话，提取关键信息并按照以下格式输出：

1. 首先，选择一个最适合的类别（从以下选项中选择一个，或者自己创建一个新的）：
${MEMORY_CATEGORIES.map(cat => `- ${cat}`).join('\n')}

2. 然后，提供一个简洁的摘要，格式为要点列表（每个要点以破折号开头）。
摘要应该捕捉：
- 用户的核心任务/问题
- 关键技术决策和偏好
- 实现方案和解决思路
- 代码架构和设计原则

请参考以下现有的记忆条目格式：

# Core Functionality
- The AIAgent class should be able to chain multiple tool calls, handle tool results, feed them back to the LLM, and include proper error handling and logging for better analysis than single-tool approaches.
- User wants to create github-agent-action package based on github-agent for automated GitHub issue analysis when issues are received.

# Build & Release Process
- User prefers using 'pnpm build all' from root directory instead of building packages individually in sequence.

输出格式：
类别：[选择的类别]
摘要：
- [要点1]
- [要点2]
- [要点3]
...

对话内容：
${conversationHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}

现有记忆内容（供参考）：
${existingMemories || "（尚无记忆条目）"}`;

	const messages: CoreMessage[] = [
		{ role: 'system', content: '你是技术项目记忆专家，擅长从对话中提取关键技术决策、架构设计和用户偏好，并将其组织成结构化的记忆条目。' },
		{ role: 'user', content: summaryPrompt }
	];

	// 调用 LLM
	const { text } = await generateText({
		model: llmConfig.openai(llmConfig.fullModel),
		messages,
		temperature: 0.2,
		maxTokens: 800
	});

	// 解析结果
	const categoryMatch = text.match(/类别：\s*([^\n]+)/);
	const summaryMatch = text.match(/摘要：\s*([\s\S]+?)(?=$|类别：)/);

	let category = categoryMatch ? categoryMatch[1].trim() : "Core Functionality";
	// 确保类别是预定义的类别之一
	if (!MEMORY_CATEGORIES.includes(category)) {
		category = "Core Functionality";
	}

	let summary = summaryMatch ? summaryMatch[1].trim() : text;
	// 如果摘要不是以破折号开头的列表，进行格式化
	if (!summary.trim().startsWith('-')) {
		summary = `- ${summary.replace(/\n/g, '\n- ')}`;
	}

	return { summary, category };
}

// 格式化记忆条目
function formatMemoryEntry(summary: string, category: string): string {
	return summary;
}
