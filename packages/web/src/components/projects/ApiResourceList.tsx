import React from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ApiResource {
  sourceHttpMethod: string;
  sourceUrl: string;
  packageName: string;
  className: string;
  methodName: string;
  type?: string;
}

interface ApiResourceListProps {
  apiResources: ApiResource[];
  isLoading: boolean;
  error?: string | null;
}

// 获取 HTTP Method 对应的样式
const getMethodColorClass = (method: string): string => {
  switch (method) {
    case 'GET':
      return 'text-green-600';
    case 'POST':
      return 'text-yellow-600';
    case 'PUT':
      return 'text-blue-600';
    case 'DELETE':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export function ApiResourceList({ apiResources, isLoading, error }: ApiResourceListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((n) => (
          <Card key={n} className="overflow-hidden">
            <CardHeader className="p-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 p-4 border border-red-200 rounded-lg">
        {error}
      </div>
    );
  }

  if (apiResources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg space-y-4 bg-gray-50">
        <Code className="h-12 w-12 text-gray-300" />
        <p className="text-center text-gray-500">暂无API资源</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {apiResources.map((api, index) => (
        <Card key={index} className="overflow-hidden py-2 gap-0">
          <CardHeader className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-mono">
                  <span className={`font-bold ${getMethodColorClass(api.sourceHttpMethod)}`}>
                    {api.sourceHttpMethod}
                  </span>
                  {' '}
                  <span className="text-gray-800">{api.sourceUrl}</span>
                </CardTitle>
                <CardDescription className="mt-2 space-y-1">
                  <div className="flex items-baseline gap-2 text-sm">
                    <span className="text-gray-500 font-medium">Package:</span>
                    <span className="font-mono text-gray-700">{api.packageName}</span>
                  </div>
                  <div className="flex items-baseline gap-2 text-sm">
                    <span className="text-gray-500 font-medium">Class:</span>
                    <span className="font-mono text-blue-600">{api.className}</span>
                  </div>
                  <div className="flex items-baseline gap-2 text-sm">
                    <span className="text-gray-500 font-medium">Method:</span>
                    <span className="font-mono text-green-600">{api.methodName}()</span>
                  </div>
                </CardDescription>
              </div>
              <Badge variant="outline">
                {api.type || 'REST'}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
