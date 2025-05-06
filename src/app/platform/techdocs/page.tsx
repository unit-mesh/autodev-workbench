"use client"

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, FileText, GitBranch, Globe } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TechDocs() {
  const [loading, setLoading] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [docUrl, setDocUrl] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [generatedDocs, setGeneratedDocs] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [existingDocs, setExistingDocs] = useState<any[]>([]);
  const [error, setError] = useState('');

  // 模拟生成文档的函数
  const generateDocsFromUrl = async (url: string) => {
    setLoading(true);
    setError('');
    try {
      // 这里应该是实际的API调用
      console.log(`生成文档从: ${url}`);
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      setGeneratedDocs({
        title: "生成的项目文档",
        content: `这是从 ${url} 生成的文档内容。实际实现中，这里应该包含从URL中获取并分析的文档内容。`
      });
    } catch (err) {
      setError('生成文档时出错。请检查URL是否有效，并稍后重试。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 模拟生成文档规范的函数
  const generateDocStandards = async (url: string) => {
    setLoading(true);
    setError('');
    try {
      console.log(`从以下地址生成文档规范: ${url}`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setGeneratedDocs({
        title: "生成的文档规范",
        content: `基于 ${url} 的文档规范。这应该包含从第三方文档中提取的规范和最佳实践。`
      });
    } catch (err) {
      setError('生成文档规范时出错。请检查URL是否有效，并稍后重试。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 模拟获取现有文档的函数
  const fetchExistingDocs = async () => {
    setLoading(true);
    setError('');
    try {
      // 这里应该是实际的API调用
      console.log('获取现有文档');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setExistingDocs([
        { id: 1, title: "API 文档", url: "/docs/api-docs.pdf", date: "2023-08-15" },
        { id: 2, title: "架构设计", url: "/docs/architecture.md", date: "2023-07-22" },
        { id: 3, title: "用户手册", url: "/docs/user-manual.pdf", date: "2023-06-10" },
      ]);
    } catch (err) {
      setError('获取文档时出错。请稍后重试。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">技术文档中心</h1>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="generate">生成项目文档</TabsTrigger>
          <TabsTrigger value="standards">生成文档规范</TabsTrigger>
          <TabsTrigger value="existing">现有文档</TabsTrigger>
        </TabsList>

        {/* 生成项目文档 */}
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>生成项目文档</CardTitle>
              <CardDescription>
                输入GitHub/GitLab仓库URL或文档URL，生成项目文档
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                generateDocsFromUrl(githubUrl);
              }}>
                <div className="grid gap-4">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    <Label htmlFor="github-url">仓库URL</Label>
                  </div>
                  <Input
                    id="github-url"
                    placeholder="https://github.com/username/repo"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button onClick={() => generateDocsFromUrl(githubUrl)} disabled={loading || !githubUrl}>
                {loading ? '生成中...' : '生成文档'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 生成文档规范 */}
        <TabsContent value="standards">
          <Card>
            <CardHeader>
              <CardTitle>生成文档规范</CardTitle>
              <CardDescription>
                读取第三方文档，生成文档规范和最佳实践
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                generateDocStandards(docUrl);
              }}>
                <div className="grid gap-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <Label htmlFor="doc-url">文档URL</Label>
                  </div>
                  <Input
                    id="doc-url"
                    placeholder="https://example.com/documentation"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button onClick={() => generateDocStandards(docUrl)} disabled={loading || !docUrl}>
                {loading ? '生成中...' : '生成规范'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 现有文档 */}
        <TabsContent value="existing">
          <Card>
            <CardHeader>
              <CardTitle>现有文档</CardTitle>
              <CardDescription>
                查看当前系统中的所有文档
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchExistingDocs} disabled={loading} className="mb-4">
                {loading ? '加载中...' : '刷新文档列表'}
              </Button>

              {existingDocs.length > 0 ? (
                <div className="border rounded-md">
                  <div className="grid grid-cols-3 gap-4 p-4 font-medium bg-gray-50">
                    <div>文档名称</div>
                    <div>更新日期</div>
                    <div>操作</div>
                  </div>
                  {existingDocs.map((doc) => (
                    <div key={doc.id} className="grid grid-cols-3 gap-4 p-4 border-t">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {doc.title}
                      </div>
                      <div>{doc.date}</div>
                      <div>
                        <Button variant="outline" size="sm">查看</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {loading ? '加载文档中...' : '点击上方按钮加载文档'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {generatedDocs && (
        <div className="mt-8 border rounded-lg p-6 bg-white">
          <h2 className="text-xl font-bold mb-4">{generatedDocs.title}</h2>
          <div className="prose max-w-none">
            <p>{generatedDocs.content}</p>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
