# 向量知识库 API 文档

## 概述

向量知识库 API 提供了管理和搜索向量化知识库的功能，包括创建、查询、搜索等操作。

## API 端点

### 1. 获取知识库列表

**GET** `/api/vector-db`

**查询参数：**
- `search` (可选): 搜索关键词
- `type` (可选): 知识库类型 (business, compliance, risk, operation)
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 10

**响应示例：**
```json
{
  "data": [
    {
      "id": 1,
      "title": "信用卡产品知识库",
      "description": "包含信用卡产品规则、费率说明...",
      "type": "business",
      "size": "2.5GB",
      "vectors": "1.2M",
      "iconName": "FileText",
      "author": {
        "name": "信用卡中心",
        "handle": "@credit-card-team",
        "verified": true
      },
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-20T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 7,
    "totalPages": 1
  }
}