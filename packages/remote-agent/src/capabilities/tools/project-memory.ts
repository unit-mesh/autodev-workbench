import { ToolLike } from "../_typing";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { CoreMessage, generateText } from "ai";
import { configureLLMProvider } from "../../services/llm";

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

			const summary = await generateSummary(conversation_history);
			const formattedSummary = formatMemory(summary);

			if (fs.existsSync(markdownPath)) {
				fs.appendFileSync(markdownPath, `\n\n${formattedSummary}`);
			} else {
				fs.writeFileSync(markdownPath, `# 对话记忆\n\n${formattedSummary}`);
			}

			return {
				content: [{
					type: "text",
					text: `✅ 对话摘要已保存到 ${markdownPath}`
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

async function generateSummary(conversationHistory: any[]): Promise<string> {
	const llmConfig = configureLLMProvider();
	if (!llmConfig) {
		throw new Error('未配置 LLM 提供者');
	}

	// 构建提示
	const summaryPrompt = `
请总结以下用户与AI助手之间的对话。
重点关注：
1. 用户试图解决的主要任务或问题
2. 发现或共享的关键信息
3. 采取的行动或实施的解决方案
4. 用户表达的任何重要决策或偏好

提供一个简洁但全面的摘要，捕捉对话的本质。

对话：
${conversationHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n\n')}
`;

	const messages: CoreMessage[] = [
		{ role: 'system', content: '你是一位擅长总结对话的专家。提供清晰、简洁的摘要，捕捉关键点和上下文。' },
		{ role: 'user', content: summaryPrompt }
	];

	// 调用 LLM
	const { text } = await generateText({
		model: llmConfig.openai(llmConfig.fullModel),
		messages,
		temperature: 0.3,
		maxTokens: 1000
	});

	return text;
}

function formatMemory(summary: string): string {
	const timestamp = new Date().toISOString();
	return `## 对话摘要 (${timestamp})\n\n${summary}`;
}
