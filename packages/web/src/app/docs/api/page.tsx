"use client"

import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

// OpenAPI 规范
const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "AutoDev Work API",
    version: "1.0.0",
    description: "AutoDev Work 平台 API 文档",
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "本地开发服务器"
    }
  ],
  paths: {
    "/ai/generate": {
      post: {
        summary: "AI 代码生成",
        description: "使用 AI 模型生成代码",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  prompt: {
                    type: "string",
                    description: "生成提示"
                  },
                  language: {
                    type: "string",
                    description: "目标编程语言"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "成功生成代码",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    code: {
                      type: "string",
                      description: "生成的代码"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/ai/analyze": {
      post: {
        summary: "代码分析",
        description: "使用 AI 分析代码并提供建议",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  code: {
                    type: "string",
                    description: "要分析的代码"
                  },
                  analysisType: {
                    type: "string",
                    enum: ["quality", "security", "performance"],
                    description: "分析类型"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "分析结果",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    suggestions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: {
                            type: "string",
                            description: "建议类型"
                          },
                          message: {
                            type: "string",
                            description: "建议内容"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/knowledge/search": {
      get: {
        summary: "知识库搜索",
        description: "搜索知识库内容",
        parameters: [
          {
            name: "query",
            in: "query",
            required: true,
            schema: {
              type: "string"
            },
            description: "搜索关键词"
          }
        ],
        responses: {
          "200": {
            description: "搜索结果",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    results: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: {
                            type: "string",
                            description: "文档标题"
                          },
                          content: {
                            type: "string",
                            description: "匹配内容"
                          },
                          relevance: {
                            type: "number",
                            description: "相关度分数"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

export default function ApiDocsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <SwaggerUI spec={openApiSpec} />
      </div>
    </div>
  );
}
