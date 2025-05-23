import { Edit, Save, Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ApiResource, CodeAnalysis, Guideline } from "@/types/project.type"
import { toast } from "@/hooks/use-toast";
import { RequirementCard, EditableRequirementCardField } from "../types/requirement.types";

export interface RequirementCardProps {
  card: RequirementCard
  onEdit: (field: EditableRequirementCardField) => void
  onSaveAsDraft: () => void
  onGenerateTask: () => void
}

export default function RequirementCardComponent({
  card,
  onEdit,
  onSaveAsDraft,
  onGenerateTask
}: RequirementCardProps) {
  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        description: successMessage,
        duration: 2000,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        description: "复制失败，请手动复制",
        duration: 2000,
      });
    }
  };

  const copyAsJson = () => {
    const jsonData = JSON.stringify(card, null, 2);
    copyToClipboard(jsonData, "已复制为JSON格式");
  };

  const copyAsAiPrompt = () => {
    const apisList = card.apis.length > 0
      ? card.apis.map(api => `- ${api.sourceUrl}`).join('\n')
      : "无关联API";

    const codeSnippetsList = card.codeSnippets.length > 0
      ? card.codeSnippets.map(snippet => `- ${snippet.title}`).join('\n')
      : "无关联代码片段";

    const guidelinesList = card.guidelines.length > 0
      ? card.guidelines.map(guideline => `- ${guideline.title} ${guideline.version}`).join('\n')
      : "无关联规范";

    const prompt = `# 需求卡片信息
功能名称: ${card.name || "待补充"}
所属模块: ${card.module || "待补充"}
功能说明: ${card.description || "待补充"}

## 关联API:
${apisList}

## 关联代码片段:
${codeSnippetsList}

## 遵循规范:
${guidelinesList}

负责人: ${card.assignee || "待分配"}
计划排期: ${card.deadline || "待排期"}
状态: ${card.status === "draft" ? "草稿" : "待确认"}
`;

    copyToClipboard(prompt, "已复制为AI Prompt格式");
  };

  return (
    <Card className="border-2 border-muted">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">需求卡片</CardTitle>
          <Badge variant={card.status === "draft" ? "outline" : "default"}>
            {card.status === "draft" ? "草稿" : "待确认"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">功能名称</Label>
              <Button variant="ghost" size="icon" onClick={() => onEdit('name')}>
                <Edit className="h-3 w-3" />
              </Button>
            </div>
            <div className="p-2 bg-muted/40 rounded text-sm">
              {card.name || <span className="text-muted-foreground">待补充</span>}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">所属模块</Label>
              <Button variant="ghost" size="icon" onClick={() => onEdit('module')}>
                <Edit className="h-3 w-3" />
              </Button>
            </div>
            <div className="p-2 bg-muted/40 rounded text-sm">
              {card.module || <span className="text-muted-foreground">待补充</span>}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">功能说明</Label>
            <Button variant="ghost" size="icon" onClick={() => onEdit('description')}>
              <Edit className="h-3 w-3" />
            </Button>
          </div>
          <div className="p-2 bg-muted/40 rounded text-sm">
            {card.description || <span className="text-muted-foreground">待补充</span>}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-medium">关联API</Label>
          {card.apis.length > 0 ? (
            <div className="p-2 bg-muted/40 rounded text-sm">
              <ul className="list-disc pl-5 space-y-1">
                {card.apis.map((api: ApiResource) => (
                  <li key={api.id}>{api.sourceUrl}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-2 bg-muted/40 rounded text-sm text-muted-foreground">无关联API</div>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-medium">关联代码片段</Label>
          {card.codeSnippets.length > 0 ? (
            <div className="p-2 bg-muted/40 rounded text-sm">
              <ul className="list-disc pl-5 space-y-1">
                {card.codeSnippets.map((snippet: CodeAnalysis) => (
                  <li key={snippet.id}>{snippet.title}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-2 bg-muted/40 rounded text-sm text-muted-foreground">无关联代码片段</div>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-medium">遵循规范</Label>
          {card.guidelines.length > 0 ? (
            <div className="p-2 bg-muted/40 rounded text-sm">
              <ul className="list-disc pl-5 space-y-1">
                {card.guidelines.map((guideline: Guideline) => (
                  <li key={guideline.id}>
                    {guideline.title} {guideline.version}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-2 bg-muted/40 rounded text-sm text-muted-foreground">无关联规范</div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex justify-between w-full">
          <div className="space-x-2">
            <Button variant="outline" onClick={copyAsJson}>
              <Copy className="h-4 w-4 mr-2" />
              复制为JSON
            </Button>
            <Button variant="outline" onClick={copyAsAiPrompt}>
              <Copy className="h-4 w-4 mr-2" />
              生成 AI IDE 提示词
            </Button>
          </div>
          <div className="space-x-2">
            <Button onClick={onGenerateTask} disabled>
              <Check className="h-4 w-4 mr-2" />
              生成需要卡片
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
