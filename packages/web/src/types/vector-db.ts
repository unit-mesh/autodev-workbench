// 向量知识库相关类型定义

export interface Author {
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
}

export interface KnowledgeBase {
  id: number;
  title: string;
  description: string;
  type: 'business' | 'compliance' | 'risk' | 'operation';
  size: string;
  vectors: string;
  iconName: string;
  author: Author;
  createdAt: string;
  updatedAt: string;
  status?: 'active' | 'inactive' | 'pending';
}

export interface KnowledgeBaseDetail extends KnowledgeBase {
  embedding_model: string;
  chunk_size: number;
  chunk_overlap: number;
  documents_count: number;
  tags: string[];
  metrics: {
    search_queries: number;
    avg_response_time: string;
    accuracy_score: number;
  };
}

export interface VectorSearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata: {
    source: string;
    page: number;
    chapter: string;
    knowledge_base_id: number;
  };
}

export interface VectorSearchResponse {
  query: string;
  results: VectorSearchResult[];
  total: number;
  search_time: string;
  embedding_model: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface KnowledgeBaseListResponse {
  data: KnowledgeBase[];
  pagination: PaginationInfo;
}

export interface CreateKnowledgeBaseRequest {
  title: string;
  description: string;
  type: string;
  size?: string;
  vectors?: string;
  iconName?: string;
  author?: Author;
}

export interface VectorSearchRequest {
  query: string;
  knowledge_base_ids?: number[];
  limit?: number;
  threshold?: number;
}