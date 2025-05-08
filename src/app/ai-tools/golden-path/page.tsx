"use client"

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface ProjectMetadata {
  name: string;
  description: string;
  type: string;
  language: string;
  framework: string;
  features: string[];
}

export default function GoldenPathPage() {
  const [metadata, setMetadata] = useState<ProjectMetadata>({
    name: '',
    description: '',
    type: 'web',
    language: 'typescript',
    framework: 'next',
    features: [],
  });

  const projectTypes = [
    { value: 'web', label: 'Web 应用' },
    { value: 'api', label: 'API 服务' },
    { value: 'cli', label: '命令行工具' },
    { value: 'library', label: '库/包' },
  ];

  const languages = [
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'go', label: 'Go' },
  ];

  const frameworks = {
    typescript: [
      { value: 'next', label: 'Next.js' },
      { value: 'react', label: 'React' },
      { value: 'vue', label: 'Vue' },
    ],
    python: [
      { value: 'fastapi', label: 'FastAPI' },
      { value: 'django', label: 'Django' },
      { value: 'flask', label: 'Flask' },
    ],
    java: [
      { value: 'spring', label: 'Spring Boot' },
      { value: 'quarkus', label: 'Quarkus' },
    ],
    go: [
      { value: 'gin', label: 'Gin' },
      { value: 'echo', label: 'Echo' },
    ],
  };

  const features = [
    { id: 'auth', label: '认证授权' },
    { id: 'database', label: '数据库集成' },
    { id: 'api-docs', label: 'API 文档' },
    { id: 'testing', label: '测试框架' },
    { id: 'logging', label: '日志系统' },
    { id: 'monitoring', label: '监控指标' },
  ];

  const handleGenerate = async () => {
    // TODO: 实现项目生成逻辑
    console.log('Generating project with metadata:', metadata);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">项目生成器</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">项目信息</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">项目名称</Label>
              <Input
                id="name"
                value={metadata.name}
                onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
                placeholder="my-awesome-project"
              />
            </div>
            
            <div>
              <Label htmlFor="description">项目描述</Label>
              <Input
                id="description"
                value={metadata.description}
                onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                placeholder="A brief description of your project"
              />
            </div>

            <div>
              <Label>项目类型</Label>
              <Select
                value={metadata.type}
                onValueChange={(value) => setMetadata({ ...metadata, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择项目类型" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>编程语言</Label>
              <Select
                value={metadata.language}
                onValueChange={(value) => setMetadata({ ...metadata, language: value, framework: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择编程语言" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>框架</Label>
              <Select
                value={metadata.framework}
                onValueChange={(value) => setMetadata({ ...metadata, framework: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择框架" />
                </SelectTrigger>
                <SelectContent>
                  {frameworks[metadata.language as keyof typeof frameworks]?.map((framework) => (
                    <SelectItem key={framework.value} value={framework.value}>
                      {framework.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">功能特性</h2>
          <div className="space-y-4">
            {features.map((feature) => (
              <div key={feature.id} className="flex items-center space-x-2">
                <Checkbox
                  id={feature.id}
                  checked={metadata.features.includes(feature.id)}
                  onCheckedChange={(checked) => {
                    const newFeatures = checked
                      ? [...metadata.features, feature.id]
                      : metadata.features.filter((f) => f !== feature.id);
                    setMetadata({ ...metadata, features: newFeatures });
                  }}
                />
                <Label htmlFor={feature.id}>{feature.label}</Label>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={!metadata.name || !metadata.framework}
        >
          生成项目
        </Button>
      </div>
    </div>
  );
} 