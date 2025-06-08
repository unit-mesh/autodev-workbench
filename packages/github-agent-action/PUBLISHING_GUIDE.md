# 📦 GitHub Actions Marketplace 发布指南

本指南将帮助您将 AutoDev GitHub Agent Action 发布到 GitHub Actions Marketplace。

## 🚀 发布步骤

### 步骤 1: 准备发布文件

运行准备脚本：

```bash
cd packages/github-agent-action
./scripts/prepare-release.sh
```

这将在根目录创建 `github-agent-action-release` 文件夹，包含所有发布需要的文件。

### 步骤 2: 创建独立的 GitHub 仓库

1. **创建新仓库**：
   - 访问：https://github.com/new
   - 仓库名称：`github-agent-action`
   - 描述：`Automated GitHub issue analysis using AI-powered code analysis`
   - 设置为 **Public**（Marketplace 要求）
   - **不要**初始化 README、.gitignore 或 LICENSE

2. **上传文件**：
   ```bash
   cd github-agent-action-release
   git init
   git add .
   git commit -m "Initial release v1.0.0"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/github-agent-action.git
   git push -u origin main
   ```

### 步骤 3: 创建 Release

1. **进入新仓库的 Releases 页面**：
   - 访问：`https://github.com/YOUR_USERNAME/github-agent-action/releases`
   - 点击 **"Create a new release"**

2. **配置 Release**：
   - **Tag version**: `v1.0.0`
   - **Release title**: `AutoDev GitHub Agent Action v1.0.0`
   - **Description**:
     ```markdown
     ## 🎉 Initial Release
     
     AutoDev GitHub Agent Action - Automated GitHub issue analysis using AI-powered code analysis.
     
     ### ✨ Features
     - 🔍 Intelligent issue analysis with AI
     - 💬 Automated comment generation
     - 🏷️ Smart label application
     - ⚙️ Configurable analysis depth
     - 🚀 Easy integration
     
     ### 🚀 Quick Start
     ```yaml
     - uses: YOUR_USERNAME/github-agent-action@v1
       with:
         github-token: ${{ secrets.GITHUB_TOKEN }}
         openai-api-key: ${{ secrets.OPENAI_API_KEY }}
     ```
     
     ### 📋 Requirements
     - GitHub token (automatically provided)
     - One of: OpenAI API key, DeepSeek token, or GLM token
     
     See [README](README.md) for detailed usage instructions.
     ```

3. **发布选项**：
   - ✅ 勾选 **"Publish this Action to the GitHub Marketplace"**
   - **Primary Category**: `Code Quality`
   - **Another Category**: `Utilities` (可选)

4. **点击 "Publish release"**

### 步骤 4: Marketplace 审核

1. **自动检查**：
   - GitHub 会自动验证您的 action.yml
   - 检查是否包含必要的文件
   - 验证 branding 配置

2. **等待审核**：
   - 通常几分钟到几小时
   - 如果有问题，GitHub 会发送邮件通知

### 步骤 5: 验证发布

1. **检查 Marketplace**：
   - 访问：https://github.com/marketplace/actions
   - 搜索 "AutoDev GitHub Agent Action"

2. **测试使用**：
   ```yaml
   - uses: YOUR_USERNAME/github-agent-action@v1
     with:
       github-token: ${{ secrets.GITHUB_TOKEN }}
       openai-api-key: ${{ secrets.OPENAI_API_KEY }}
   ```

## 📋 发布检查清单

### ✅ 必需文件
- [ ] `action.yml` - Action 定义文件
- [ ] `README.md` - 详细文档
- [ ] `LICENSE` - 开源许可证
- [ ] `dist/index.js` - 构建后的主文件

### ✅ action.yml 要求
- [ ] `name` - Action 名称
- [ ] `description` - 简短描述
- [ ] `author` - 作者信息
- [ ] `branding` - 图标和颜色
- [ ] `inputs` - 输入参数定义
- [ ] `outputs` - 输出参数定义
- [ ] `runs` - 运行配置

### ✅ 仓库要求
- [ ] 仓库必须是 **Public**
- [ ] 包含有意义的 README
- [ ] 有适当的开源许可证
- [ ] 代码质量良好

### ✅ Marketplace 要求
- [ ] 唯一的 Action 名称
- [ ] 清晰的描述和文档
- [ ] 适当的分类标签
- [ ] 有效的 branding 配置

## 🔄 更新发布

### 发布新版本

1. **更新代码**
2. **重新构建**：`pnpm run build`
3. **创建新 Release**：`v1.1.0`
4. **更新文档**

### 版本标签策略

- **Major**: `v1`, `v2` - 重大更改
- **Minor**: `v1.1`, `v1.2` - 新功能
- **Patch**: `v1.1.1`, `v1.1.2` - 修复

## 🎯 最佳实践

1. **文档完整**：
   - 详细的 README
   - 清晰的使用示例
   - 完整的参数说明

2. **测试充分**：
   - 在发布前充分测试
   - 提供测试工作流

3. **版本管理**：
   - 使用语义化版本
   - 维护 CHANGELOG

4. **用户支持**：
   - 及时回复 Issues
   - 提供帮助文档

## 🆘 常见问题

### Q: 发布失败怎么办？
A: 检查 action.yml 格式，确保所有必需字段都存在。

### Q: 如何更新已发布的 Action？
A: 创建新的 Release 并使用新的版本标签。

### Q: 可以删除已发布的版本吗？
A: 可以删除 Release，但建议使用弃用标记。

### Q: 如何处理安全问题？
A: 立即修复并发布新版本，在 README 中说明。

## 📞 获取帮助

- 📖 [GitHub Actions 文档](https://docs.github.com/en/actions)
- 🏪 [Marketplace 指南](https://docs.github.com/en/actions/creating-actions/publishing-actions-in-github-marketplace)
- 💬 [GitHub Community](https://github.community/)

---

🎉 **祝您发布成功！** 如果遇到问题，请查看 GitHub Actions 官方文档或联系社区支持。
