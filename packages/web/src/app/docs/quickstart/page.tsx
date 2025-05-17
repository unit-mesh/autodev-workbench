"use client"

import React from 'react';
import { ArrowRight, Terminal, Code, BookOpen, BarChart3, Package } from 'lucide-react';

export default function QuickStartPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">快速开始指南</h1>

      <div className="space-y-8">
        {/* 项目概述 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">项目概述</h2>
          <p className="text-gray-600 mb-4">
            AutoDev Workbench 是一个为开发团队提供统一平台的解决方案，旨在通过 AI 技术提升开发效率和质量。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <Code className="h-5 w-5 mr-2 text-blue-600" />
                <h3 className="font-medium">AI 驱动开发</h3>
              </div>
              <p className="text-sm text-gray-600">利用先进的 AI 工具和模型辅助编码、调试和问题解决</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                <h3 className="font-medium">知识管理</h3>
              </div>
              <p className="text-sm text-gray-600">集中管理和组织开发知识、模式和最佳实践</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                <h3 className="font-medium">工作流自动化</h3>
              </div>
              <p className="text-sm text-gray-600">通过智能自动化和模式识别简化开发流程</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <Package className="h-5 w-5 mr-2 text-blue-600" />
                <h3 className="font-medium">组件市场</h3>
              </div>
              <p className="text-sm text-gray-600">访问可重用组件和库的市场，加速开发</p>
            </div>
          </div>
        </section>

        {/* 技术栈 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">技术栈</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <ul className="space-y-2">
              <li className="flex items-center">
                <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                <span>前端：Next.js with TypeScript</span>
              </li>
              <li className="flex items-center">
                <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                <span>UI 框架：Tailwind CSS</span>
              </li>
              <li className="flex items-center">
                <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                <span>状态管理：React Context</span>
              </li>
              <li className="flex items-center">
                <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                <span>AI 集成：多种 AI 模型和 API</span>
              </li>
              <li className="flex items-center">
                <ArrowRight className="h-4 w-4 mr-2 text-blue-600" />
                <span>认证：NextAuth.js</span>
              </li>
            </ul>
          </div>
        </section>

        {/* 开始使用 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">项目搭建与问题解决指南</h2>

          <div className="mb-6">

            <p className="text-gray-600 mb-3">本指南将帮助您快速搭建和运行AutoDev Workbench项目，并提供常见问题的解决方案</p>

            <div className="mb-6">
              <h4 className="text-base font-medium mb-2">一、环境准备与初始化</h4>

              <ol className="list-decimal list-inside space-y-4 text-gray-700">
                <li>
                  <span className="font-medium">克隆项目并安装依赖</span>
                  <pre className="bg-gray-800 p-2 rounded mt-2">
                    <p className="text-gray-300">运行以下命令</p>
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">git clone &lt;项目仓库地址&gt;</code>
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">cd autodev-workbench</code>
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">pnpm install</code>
                  </pre>
                </li>

                <li>
                  <span className="font-medium">环境变量配置</span><span className="text-red-500 ml-1">(必要步骤)</span>
                  <pre className="bg-gray-800 p-2 rounded mt-2">
                    <p className="text-gray-300">复制环境变量模板文件</p>
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">cd packages/web</code>
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">cp env.example .env</code>
                  </pre>

                  <div className="mt-2 mb-2">
                    <p className="text-gray-600">编辑 <code className="bg-gray-100 px-1.5 py-0.5 rounded">.env</code> 文件，添加以下配置：</p>
                    <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">
                      <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300"># 数据库连接配置 - 替换为实际的用户名和密码</pre>
                      <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@ep-holy-mode</pre>
                      <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">POSTGRES_URL=postgresql://YOUR_USER:YOUR_PASSWORD@ep-holy-mode</pre>
                      <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">POSTGRES_URL_NON_POOLING=postgresql://YOUR_USER:YOUR_PASSWORD@ep-holy-mode</pre>
                      <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300"></pre>
                      <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300"># 安全相关配置</pre>
                      <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">SECRET=&quot;your-secret-key-for-auth-sessions&quot;</pre>
                      <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300"># OAuth配置（可选）</pre>
                      <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">GITHUB_CLIENT_ID=&quot;your-github-client-id&quot;</pre>
                      <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">GITHUB_CLIENT_SECRET=&quot;your-github-client-secret&quot;</pre>
                    </pre>
                  </div>
                </li>

                <li>
                  <span className="font-medium">数据库初始化</span>
                  <pre className="bg-gray-800 p-2 rounded mt-2">
                    <p className="text-gray-300">初始化Prisma</p>
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">cd packages/web</code>
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">npx prisma generate</code>
                    <p className="text-gray-300 mt-2">执行数据库迁移</p>
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">npx prisma migrate deploy</code>
                  </pre>

                  <p className="text-gray-600 mt-2">或者直接在 <a href="https://console.neon.tech/" className="text-blue-600 hover:underline">Neon SQL编辑器</a> 中按顺序执行 <code className="bg-gray-100 px-1.5 py-0.5 rounded">web/prisma</code> 目录中的所有SQL文件。</p>
                </li>

                <li>
                  <span className="font-medium">安装依赖工具：ripgrep</span><span className="text-gray-500 ml-1">(用于代码搜索)</span>
                  <div className="space-y-2 mt-2">
                    <pre className="bg-gray-800 p-2 rounded">
                      <p className="text-gray-300">macOS安装</p>
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">brew install ripgrep</code>

                      <p className="text-gray-300 mt-3">Linux系统安装</p>
                      <p className="text-gray-300 mt-1">Debian/Ubuntu</p>
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">sudo apt update && sudo apt install ripgrep</code>
                      <p className="text-gray-300 mt-1">Fedora</p>
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">sudo dnf install ripgrep</code>
                      <p className="text-gray-300 mt-1">Arch Linux</p>
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">sudo pacman -S ripgrep</code>

                      <p className="text-gray-300 mt-3">Windows系统安装</p>
                      <p className="text-gray-300 mt-1">通过scoop（需先安装scoop）</p>
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">Set-ExecutionPolicy RemoteSigned -Scope CurrentUser</code>
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">iwr -useb get.scoop.sh | iex</code>
                      <p className="text-gray-300 mt-1">通过scoop安装</p>
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">scoop install ripgrep</code>
                      <p className="text-gray-300 mt-1">通过Chocolatey</p>
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">choco install ripgrep</code>

                      <p className="text-gray-300 mt-3">验证安装</p>
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">rg --version</code>
                    </pre>
                  </div>
                </li>
              </ol>
            </div>

            <div className="mb-6">
              <h4 className="text-base font-medium mb-2">二、常见问题与解决方案</h4>

              <div className="space-y-4">
                <div>
                  <p className="font-medium">1. Prisma 迁移失败问题</p>
                  <p className="text-gray-600 mt-1"><span className="font-medium">问题表现</span>：执行 <code className="bg-gray-100 px-1.5 py-0.5 rounded">npx prisma migrate deploy</code> 时出现 <code className="bg-gray-100 px-1.5 py-0.5 rounded">P3005</code> 错误，提示 &quot;数据库模式非空&quot;。</p>

                  <p className="text-gray-600 mt-2"><span className="font-medium">解决方案</span>：</p>
                  <ul className="list-disc list-inside ml-4 text-gray-700">
                    <li>确保 <code className="bg-gray-100 px-1.5 py-0.5 rounded">.env</code> 文件中配置了正确的 <code className="bg-gray-100 px-1.5 py-0.5 rounded">DATABASE_URL</code></li>
                    <li>如果是已存在的数据库，使用基线迁移：
                      <pre className="bg-gray-800 p-2 rounded mt-1 ml-6">
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">npx prisma migrate resolve --applied &quot;init&quot;</code>
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">npx prisma migrate deploy</code>
                      </pre>
                    </li>
                    <li>或者重新创建空数据库后再执行迁移</li>
                  </ul>
                </div>



              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-base font-medium mb-2">三、项目启动与开发</h4>

              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>
                  <span className="font-medium">启动开发服务器</span>
                  <pre className="bg-gray-800 p-2 rounded mt-1">
                    <p className="text-gray-300">在项目根目录执行</p>
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">pnpm dev</code>
                    <p className="text-gray-300 mt-2">或者指定web包</p>
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">pnpm --filter web dev</code>
                  </pre>
                </li>

                <li>
                  <span className="font-medium">浏览器访问</span>
                  <p className="text-gray-600 mt-1">打开 <a href="http://localhost:3000" className="text-blue-600 hover:underline">http://localhost:3000</a> 查看应用。</p>
                </li>

                <li>
                  <span className="font-medium">构建生产版本</span>
                  <pre className="bg-gray-800 p-2 rounded mt-1">
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">pnpm build</code>
                  </pre>
                </li>

                <li>
                  <span className="font-medium">运行生产版本</span>
                  <pre className="bg-gray-800 p-2 rounded mt-1">
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">pnpm start</code>
                  </pre>
                </li>
              </ol>
            </div>

            <div className="mb-6">
              <h4 className="text-base font-medium mb-2">四、项目结构说明</h4>

              <pre className="bg-gray-800 p-2 rounded mt-1 text-gray-300">
                <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">autodev-workbench/</pre>
                <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">  ├── packages/</pre>
                <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">  │   └── web/               # 主要的Next.js应用</pre>
                <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">  │       ├── prisma/        # Prisma数据库模型和迁移</pre>
                <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">  │       ├── src/ </pre>
                <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">  │       │   ├── app/       # Next.js应用目录</pre>
                <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">  │       │   │   ├── api/   # API路由目录</pre>
                <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">  │       │   │   └── ...    # 页面组件</pre>
                <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">  │       │   ├── components/ # 共享组件</pre>
                <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">  │       │   └── ...</pre>
                <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">  │       └── ...</pre>
                <pre className="bg-gray-800 p-2 rounded mt-2 text-gray-300">  └── ...</pre>
              </pre>
            </div>

            <div className="mb-6">
              <h4 className="text-base font-medium mb-2">五、进阶使用技巧</h4>

              <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li>
                  <span className="font-medium">数据库操作</span>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>使用Prisma Studio查看和编辑数据：
                      <pre className="bg-gray-800 p-2 rounded mt-1 ml-6">
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">cd packages/web</code>
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded block my-1">npx prisma studio</code>
                      </pre>
                    </li>
                  </ul>
                </li>

                <li>
                  <span className="font-medium">API开发</span>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>所有API路由都位于 <code className="bg-gray-100 px-1.5 py-0.5 rounded">src/app/api</code> 目录</li>
                    <li>使用共享的数据库连接池 <code className="bg-gray-100 px-1.5 py-0.5 rounded">pool</code> 而非单独创建连接</li>
                  </ul>
                </li>

                <li>
                  <span className="font-medium">组件开发</span>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>确保新组件遵循项目的设计系统和样式规范</li>
                    <li>对于表单组件，正确处理 <code className="bg-gray-100 px-1.5 py-0.5 rounded">data-empty</code> 属性</li>
                  </ul>
                </li>

                <li>
                  <span className="font-medium">环境变量管理</span>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>本地开发使用 <code className="bg-gray-100 px-1.5 py-0.5 rounded">.env</code> 文件</li>
                    <li>部署到Vercel时，在项目设置中配置环境变量</li>
                  </ul>
                </li>
              </ol>
            </div>

            <p className="text-gray-600">通过本指南，您应该能够成功搭建和运行AutoDev Workbench项目，并避免常见的配置和开发问题。如有任何疑问，请参考项目文档或向开发团队寻求帮助。</p>
          </div>



          <div className="bg-gray-900 text-white p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Terminal className="h-5 w-5 mr-2" />
              <span className="font-mono">运行开发服务器</span>
            </div>
            <div className="space-y-2">
              <p className="text-gray-300">使用以下任一命令启动开发服务器：</p>
              <pre className="bg-gray-800 p-2 rounded">
                <code>npm run dev</code>
              </pre>
              <pre className="bg-gray-800 p-2 rounded">
                <code>yarn dev</code>
              </pre>
              <pre className="bg-gray-800 p-2 rounded">
                <code>pnpm dev</code>
              </pre>
              <pre className="bg-gray-800 p-2 rounded">
                <code>bun dev</code>
              </pre>
            </div>
          </div>
          <p className="mt-4 text-gray-600">
            启动后，在浏览器中打开 <a href="http://localhost:3000" className="text-blue-600 hover:underline">http://localhost:3000</a> 查看结果。
          </p>
        </section>

        {/* 学习资源 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">学习资源</h2>
          <div className="space-y-4">
            <a href="https://nextjs.org/docs" className="block p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-medium text-blue-600">Next.js 文档</h3>
              <p className="text-sm text-gray-600">了解 Next.js 的特性和 API</p>
            </a>
            <a href="https://nextjs.org/learn" className="block p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-medium text-blue-600">Next.js 教程</h3>
              <p className="text-sm text-gray-600">交互式 Next.js 教程</p>
            </a>
            <a href="https://github.com/vercel/next.js" className="block p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-medium text-blue-600">Next.js GitHub 仓库</h3>
              <p className="text-sm text-gray-600">欢迎提供反馈和贡献</p>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
