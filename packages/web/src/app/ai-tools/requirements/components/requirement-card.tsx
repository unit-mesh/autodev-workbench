import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { RequirementCard } from "@/types/requirement.types";
import { Edit3, Clipboard, Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { EditableRequirementCardField } from "@/types/requirement.types";
import { ApiResource, CodeAnalysis, Guideline } from "@/types/project.type";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

class EventSourceParserStream extends TransformStream<string, {id?: string, event?: string, data: string}> {
  constructor() {
    let buffer = '';
    let currentId: string | undefined;
    let currentEvent: string | undefined;

    super({
      transform(chunk, controller) {
        buffer += chunk;
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';

        let field = '';
        let value = '';

        for (const line of lines) {
          if (!line) {
            if (field === 'data') {
              controller.enqueue({ id: currentId, event: currentEvent, data: value });
              value = '';
              currentEvent = undefined;
            }
            continue;
          }

          if (line.startsWith(':')) continue;

          const colonIndex = line.indexOf(':');
          if (colonIndex === -1) {
            field = line;
            value = '';
          } else {
            field = line.slice(0, colonIndex);
            value = line.slice(colonIndex + 1).trimStart();
          }

          switch (field) {
            case 'event':
              currentEvent = value;
              break;
            case 'id':
              currentId = value;
              break;
            case 'data':
              break;
          }
        }
      }
    });
  }
}

interface RequirementCardComponentProps {
  card: RequirementCard;
  onEdit: (field: EditableRequirementCardField) => void;
  onGenerateAiPrompt: () => void;
  onGenerateTask: () => void;
}

export default function RequirementCardComponent({
  card,
  onEdit,
  onGenerateAiPrompt,
  onGenerateTask,
}: RequirementCardComponentProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copyState, setCopyState] = useState({
    prompt: false,
    response: false
  });

  const generatePrompt = () => {
    const prompt = `请将以下需求卡片的信息重新组织成一个高质量的系统提示词（System Prompt），使其适合给AI Coding Agent使用。
你的目标是创建一个清晰、结构化的系统提示词，使AI Coding Agent能更好地理解需求并生成实现代码。
不要直接实现功能，而是将知识重新组织成更清晰的格式。

需求卡片原始信息:
需求名称: ${card.name}
模块: ${card.module}
需求描述: ${card.description}

${card.apis.length > 0 ? `相关API:
${card.apis.map(api => `- 方法名称: ${api.methodName}
  URL: ${api.sourceUrl}
  描述: ${api.packageName} ${api.className} ${api.methodName}
`).join('\n\n')}` : ''}

${card.codeSnippets.length > 0 ? `相关代码片段:
${card.codeSnippets.map(snippet => `- 标题: ${snippet.title}
  描述: ${snippet.description || '无描述'}
  路径: ${snippet.path || '无路径信息'}
  代码内容:
  \`\`\`
  ${snippet.content || '// 无代码内容'}
  \`\`\``).join('\n\n')}
` : ''}

${card.guidelines.length > 0 ? `需要遵循的规范与标准:
${card.guidelines.map(guideline => `- 标题: ${guideline.title}
  内容:
  ${guideline.content || '无详细内容'}`).join('\n\n')}
` : ''}

${card.assignee ? `负责人: ${card.assignee}` : ''}
${card.deadline ? `截止日期: ${card.deadline}` : ''}

请基于以上信息，创建一个高质量的系统提示词，包含以下部分：

1. 任务背景和上下文
2. 关键的代码概念、信息和 API 等
3. 需要包含相关的代码路径，方便进行检索

返回一个可以直接用作 system prompt 的文本，使其能够指导 AI Coding 工具，如 Cursor、Copilot 进行高质量的代码实现。`;
    return prompt;
  };

  const callAiApi = async (prompt: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          stream: true
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      let streamedResponse = '';

      const eventStream = response.body!
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new EventSourceParserStream());

      for await (const { data } of eventStream) {
        if (data === "[DONE]") break;

        try {
          streamedResponse += JSON.parse(data).text;
          setAiResponse(streamedResponse);
        } catch (error) {
          console.error("Error parsing stream data:", error);
        }
      }

      return streamedResponse;
    } catch (error) {
      console.error("Error calling AI API:", error);
      setAiResponse("抱歉，生成响应时出错。请稍后再试。");
      return "抱歉，生成响应时出错。请稍后再试。";
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePrompt = async () => {
    const prompt = generatePrompt();
    setGeneratedPrompt(prompt);
    setDialogOpen(true);
    setAiResponse("");

    // Stream response
    await callAiApi(prompt);

    // Still call the original onGenerateAiPrompt if needed
    onGenerateAiPrompt();
  };

  const copyToClipboard = async (type: 'prompt' | 'response') => {
    try {
      const text = type === 'prompt' ? generatedPrompt : aiResponse;
      await navigator.clipboard.writeText(text);

      setCopyState({
        ...copyState,
        [type]: true
      });

      setTimeout(() => {
        setCopyState({
          ...copyState,
          [type]: false
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-semibold tracking-tight">{card.name}</h3>
                <button
                  onClick={() => onEdit("name")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  模块: {card.module}
                </p>
                <button
                  onClick={() => onEdit("module")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              {card.status === "draft" ? "草稿" :
               card.status === "pending" ? "待审核" : "已批准"}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">需求描述</h4>
                <button
                  onClick={() => onEdit("description")}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
              </div>
              <p className="text-sm text-gray-600">{card.description}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">相关API</h4>
              <div className="flex flex-wrap gap-1">
                {card.apis.map((api: ApiResource, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700"
                  >
                    {api.methodName} {api.sourceUrl}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">代码片段</h4>
              <div className="flex flex-wrap gap-1">
                {card.codeSnippets.map((snippet: CodeAnalysis, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 text-xs rounded bg-violet-50 text-violet-700"
                  >
                    {snippet.title}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">规范与标准</h4>
              <div className="flex flex-wrap gap-1">
                {card.guidelines.map((guideline: Guideline, index) => (
                  <div
                    key={index}
                    className="px-2 py-1 text-xs rounded bg-green-50 text-green-700"
                  >
                    {guideline.title}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-gray-500">负责人</p>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-sm">{card.assignee || "未分配"}</p>
                  <button
                    onClick={() => onEdit("assignee")}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">截止日期</p>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-sm">{card.deadline || "未设置"}</p>
                  <button
                    onClick={() => onEdit("deadline")}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={handleGeneratePrompt}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
             生成 AI IDE 提示词
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1"
            onClick={onGenerateTask}
          >
            <Clipboard className="h-4 w-4" />
            生成任务
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] h-[90vh] flex flex-col p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">知识系统提示词</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-auto">
            {/* Left Column - Prompt */}
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-medium">系统提示词请求</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 flex items-center gap-1.5"
                  onClick={() => copyToClipboard('prompt')}
                >
                  {copyState.prompt ? (
                    <>
                      <Check className="h-4 w-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      复制
                    </>
                  )}
                </Button>
              </div>
              <div className="relative flex-grow">
                <Textarea
                  value={generatedPrompt}
                  readOnly
                  className="absolute inset-0 w-full h-full min-h-[400px] resize-none font-mono text-sm p-4 border-2 rounded-md overflow-auto"
                />
              </div>
            </div>

            {/* Right Column - AI Response */}
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-medium">生成的系统提示词</h3>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 flex items-center gap-1.5"
                  onClick={() => copyToClipboard('response')}
                  disabled={isLoading || !aiResponse}
                >
                  {copyState.response ? (
                    <>
                      <Check className="h-4 w-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      复制
                    </>
                  )}
                </Button>
              </div>
              <div className="relative flex-grow overflow-hidden">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center border-2 rounded-md bg-gray-50">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">AI 正在生成回复...</p>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    value={aiResponse}
                    readOnly
                    className="absolute inset-0 w-full h-full min-h-[400px] resize-none font-mono text-sm p-4 border-2 rounded-md overflow-auto"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Mobile view with tabs */}
          <div className="md:hidden w-full mt-4">
            <Tabs defaultValue="prompt" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="prompt">提示词请求</TabsTrigger>
                <TabsTrigger value="response">系统提示词</TabsTrigger>
              </TabsList>
              <TabsContent value="prompt" className="mt-3">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => copyToClipboard('prompt')}
                  >
                    {copyState.prompt ? (
                      <>
                        <Check className="h-4 w-4 mr-1.5" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1.5" />
                        复制
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  value={generatedPrompt}
                  readOnly
                  className="h-[350px] font-mono text-sm p-3 resize-none border-2 rounded-md"
                />
              </TabsContent>
              <TabsContent value="response" className="mt-3">
                <div className="flex justify-end mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => copyToClipboard('response')}
                    disabled={isLoading || !aiResponse}
                  >
                    {copyState.response ? (
                      <>
                        <Check className="h-4 w-4 mr-1.5" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1.5" />
                        复制
                      </>
                    )}
                  </Button>
                </div>
                {isLoading ? (
                  <div className="h-[350px] flex items-center justify-center border-2 rounded-md bg-gray-50">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-7 w-7 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">AI 正在生成回复...</p>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    value={aiResponse}
                    readOnly
                    className="h-[350px] font-mono text-sm p-3 resize-none border-2 rounded-md"
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
