import { FrameworkItem, FeatureCategory, ProjectType, Language } from '../types';

export const PROJECT_TYPES: ProjectType[] = [
	{ value: 'web', label: 'Web 应用' },
	{ value: 'api', label: 'API 服务' },
	{ value: 'microservice', label: '微服务' },
	{ value: 'cli', label: '命令行工具' },
	{ value: 'library', label: '库/包' },
];

export const LANGUAGES: Language[] = [
	{ value: 'java', label: 'Java' },
	{ value: 'kotlin', label: 'Kotlin' },
	{ value: 'typescript', label: 'TypeScript' },
	{ value: 'python', label: 'Python' },
	{ value: 'go', label: 'Go' },
];

export const FRAMEWORKS: Record<string, FrameworkItem[]> = {
	java: [
		{ value: 'spring3', label: 'Spring Boot 3.x' },
		{ value: 'spring2', label: 'Spring Boot 2.x', legacy: true },
		{ value: 'quarkus', label: 'Quarkus' },
		{ value: 'micronaut', label: 'Micronaut' },
	],
	kotlin: [
		{ value: 'spring3', label: 'Spring Boot 3.x' },
		{ value: 'spring2', label: 'Spring Boot 2.x', legacy: true },
		{ value: 'ktor', label: 'Ktor' },
	],
	typescript: [
		{ value: 'next', label: 'Next.js' },
		{ value: 'express', label: 'Express' },
		{ value: 'nestjs', label: 'NestJS' },
	],
	python: [
		{ value: 'fastapi', label: 'FastAPI' },
		{ value: 'django', label: 'Django' },
		{ value: 'flask', label: 'Flask' },
	],
	go: [
		{ value: 'gin', label: 'Gin' },
		{ value: 'echo', label: 'Echo' },
		{ value: 'fiber', label: 'Fiber' },
	],
};

export const FEATURE_CATEGORIES: FeatureCategory[] = [
	{
		title: "基础后端组件",
		description: "构建应用程序核心功能所需的基础组件",
		features: [
			{ id: 'auth', label: '认证授权', description: '包含 JWT、OAuth2、RBAC 等认证与授权能力' },
			{ id: 'database', label: '数据库集成', description: '集成关系型数据库及 ORM 框架' },
			{ id: 'nosql', label: 'NoSQL 数据库', description: '集成非关系型数据库如 MongoDB、Redis' },
			{ id: 'api-docs', label: 'API 文档', description: '自动生成 Swagger/OpenAPI 文档' },
			{ id: 'validation', label: '数据验证', description: '请求参数验证和业务规则校验' },
			{ id: 'cache', label: '缓存系统', description: '本地缓存和分布式缓存方案' },
			{ id: 'messaging', label: '消息队列', description: '集成 Kafka、RabbitMQ 等消息中间件' },
		]
	},
	{
		title: "PaaS 组件",
		description: "云平台相关的功能组件",
		features: [
			{ id: 'service-discovery', label: '服务发现', description: '集成服务注册与发现组件' },
			{ id: 'config-server', label: '配置中心', description: '外部集中化配置管理' },
			{ id: 'api-gateway', label: 'API 网关', description: '请求路由、限流、认证等网关功能' },
			{ id: 'distributed-tracing', label: '分布式追踪', description: '请求追踪和链路分析' },
			{ id: 'cloud-storage', label: '云存储', description: '对象存储、文件系统集成' },
			{ id: 'serverless', label: 'Serverless', description: '无服务器函数即服务能力' },
		]
	},
	{
		title: "DevOps 工具",
		description: "持续集成、部署和运维相关功能",
		features: [
			{ id: 'docker', label: 'Docker 支持', description: 'Dockerfile 和容器化配置' },
			{ id: 'kubernetes', label: 'Kubernetes 配置', description: 'K8s 部署清单和配置' },
			{ id: 'ci-cd', label: 'CI/CD 流水线', description: '持续集成和部署配置' },
			{ id: 'testing', label: '测试框架', description: '单元测试、集成测试和性能测试' },
			{ id: 'logging', label: '日志系统', description: '结构化日志和聚合方案' },
			{ id: 'monitoring', label: '监控指标', description: '应用监控和健康检查' },
			{ id: 'chaos-engineering', label: '混沌工程', description: '故障注入和弹性测试工具' },
		]
	}
];

export const DEFAULT_PROJECT_METADATA = {
	name: '',
	description: '',
	type: 'web',
	language: 'java',
	framework: 'spring3',
	features: [],
};

export const PROJECT_TYPE_MAPPING = {
	web: 'monolith',
	api: 'monolith',
	microservice: 'microservice',
	library: 'library',
	cli: 'library',
} as const;
