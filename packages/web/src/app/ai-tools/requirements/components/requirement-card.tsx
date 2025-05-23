import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { RequirementCard } from "@/app/ai-tools/requirements/types/requirement.types";
import { Edit3, CheckCircle, Clipboard } from "lucide-react";
import { EditableRequirementCardField } from "@/app/ai-tools/requirements/types/requirement.types";

interface RequirementCardComponentProps {
  card: RequirementCard;
  onEdit: (field: EditableRequirementCardField) => void;
  onSaveAsDraft: () => void;
  onGenerateTask: () => void;
}

export default function RequirementCardComponent({
  card,
  onEdit,
  onSaveAsDraft,
  onGenerateTask,
}: RequirementCardComponentProps) {
  return (
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
              {card.apis.map((api, index) => (
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
              {card.codeSnippets.map((snippet, index) => (
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
              {card.guidelines.map((guideline, index) => (
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
          onClick={onSaveAsDraft}
        >
          <CheckCircle className="h-4 w-4" />
          保存为草稿
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
  );
}
