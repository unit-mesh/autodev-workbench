import 'reflect-metadata';
import { describe, it, expect, beforeEach } from 'vitest';

import { TestLanguageServiceProvider } from "../../TestLanguageService";
import { FastApiAnalyser } from "../../../code-context/python/FastApiAnalyser";
import { PythonProfile } from '../../../code-context/python/PythonProfile';
import { PythonStructurer } from '../../../code-context/python/PythonStructurer';

const Parser = require('web-tree-sitter');

describe('FastApiAnalyser', () => {
  let parser: any;
  let languageService: TestLanguageServiceProvider;
  let analyser: FastApiAnalyser;

  beforeEach(async () => {
    await Parser.init();
    parser = new Parser();
    languageService = new TestLanguageServiceProvider(parser);

    // 创建必要的依赖
    const pythonProfile = new PythonProfile();
    const pythonStructurer = new PythonStructurer();

    analyser = new FastApiAnalyser(pythonProfile, pythonStructurer);
    await analyser.init(languageService);
  });

  it('应该正确识别标准的 FastAPI 路由', async () => {
    const fastApiCode = `from fastapi import FastAPI, APIRouter

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}

@app.post("/items/")
def create_item(item: dict):
    return {"item_name": item["name"], "item_id": "123"}
`;

    await analyser.sourceCodeAnalysis(fastApiCode, 'main.py', '/workspace');

    const resources = analyser.resources;
    expect(resources.length).toBe(3);
    expect(resources[0]).toMatchObject({
      sourceUrl: '/',
      sourceHttpMethod: 'GET',
      packageName: '',
      className: 'main',
      methodName: 'read_root'
    });

    // 检查第二个端点
    expect(resources[1]).toMatchObject({
      sourceUrl: '/items/{item_id}',
      sourceHttpMethod: 'GET',
      packageName: '',
      className: 'main',
      methodName: 'read_item'
    });

    // 检查第三个端点
    expect(resources[2]).toMatchObject({
      sourceUrl: '/items/',
      sourceHttpMethod: 'POST',
      packageName: '',
      className: 'main',
      methodName: 'create_item'
    });
  });

  it('应该正确识别带有路由器的 FastAPI 路由', async () => {
    const fastApiRouterCode = `from fastapi import FastAPI, APIRouter

app = FastAPI()
router = APIRouter(prefix="/api/v1")

@router.get("/users")
def list_users():
    return [{"name": "Harry"}, {"name": "Ron"}]

@router.get("/users/{user_id}")
def get_user(user_id: int):
    return {"user_id": user_id, "name": "Harry"}

@router.post("/users")
def create_user(user: dict):
    return {"id": "123", "name": user["name"]}

# 注册路由器到应用
app.include_router(router)
`;

    await analyser.sourceCodeAnalysis(fastApiRouterCode, 'users.py', '/workspace');

    const resources = analyser.resources;
    expect(resources.length).toBe(3);
    expect(resources[0]).toMatchObject({
      sourceUrl: '/users',
      sourceHttpMethod: 'GET',
      packageName: '',
      className: 'users',
      methodName: 'list_users'
    });

    // 检查第二个端点
    expect(resources[1]).toMatchObject({
      sourceUrl: '/users/{user_id}',
      sourceHttpMethod: 'GET',
      packageName: '',
      className: 'users',
      methodName: 'get_user'
    });

    // 检查第三个端点
    expect(resources[2]).toMatchObject({
      sourceUrl: '/users',
      sourceHttpMethod: 'POST',
      packageName: '',
      className: 'users',
      methodName: 'create_user'
    });
  });

  it('应该正确识别带有额外挂载前缀的 FastAPI 路由', async () => {
    const fastApiMountedCode = `from fastapi import FastAPI, APIRouter

app = FastAPI()
router = APIRouter()  # 路由器没有前缀

@router.get("/products")
def list_products():
    return [{"name": "Broom"}, {"name": "Wand"}]

@router.get("/products/{product_id}")
def get_product(product_id: int):
    return {"product_id": product_id, "name": "Nimbus 2000"}

# 路由器挂载时指定前缀
app.include_router(router, prefix="/store/v1")
`;

    await analyser.sourceCodeAnalysis(fastApiMountedCode, 'products.py', '/workspace');

    const resources = analyser.resources;
    expect(resources.length).toBe(2);
    expect(resources[0]).toMatchObject({
      sourceUrl: '/products',
      sourceHttpMethod: 'GET',
      packageName: '',
      className: 'products',
      methodName: 'list_products'
    });

    // 检查第二个端点
    expect(resources[1]).toMatchObject({
      sourceUrl: '/products/{product_id}',
      sourceHttpMethod: 'GET',
      packageName: '',
      className: 'products',
      methodName: 'get_product'
    });
  });
});
