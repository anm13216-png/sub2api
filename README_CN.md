# Sub2API (Cloudflare Native Serverless Edition)

[![Deploy to Cloudflare Worker](https://github.com/axzcnzxis/sub2api/actions/workflows/deploy-cloudflare.yml/badge.svg)](https://github.com/axzcnzxis/sub2api/actions/workflows/deploy-cloudflare.yml)
[![License: LGPL v3](https://img.shields.io/badge/License-LGPL_v3-blue.svg)](LICENSE)

**Sub2API (Cloudflare Native)** 是基于 Cloudflare Serverless 全家桶重构的开源 AI API 网关与订阅配额调度平台。

零服务器成本（100% Free Tier 可运行），支持将 Claude Pro/Team、OpenAI ChatGPT、Gemini、Grok 等订阅账号转为标准 OpenAI / Anthropic 兼容 API 接口，并自动调度与负载均衡。

---

## 🚀 核心架构与特性

- **纯边缘计算 (Cloudflare Workers + Hono.js)**：全局极低延迟，基于 Web Standard Stream 的高性流式响应 (SSE) 代理。
- **边缘数据库 (Cloudflare D1)**：轻量级 SQLite 边缘数据库，存储用户、密钥与账号关联。
- **毫秒级缓存与退避 (Cloudflare KV)**：记录 API Key 鉴权与上游 429 速率限制冷却标记，实现智能故障转移与退避（Cooldown）。
- **零成本前端 (Cloudflare Pages)**：Vue 3 控制台全自动化免费托管。
- **全自动 CI/CD (GitHub Actions)**：无需本地配置 Node.js 或 Wrangler 环境，在 GitHub 页面点击 **Run workflow** 即可全自动一键部署上云！

---

## 🛠️ 自动化部署指南 (GitHub Actions 推荐)

### 第一步：在 GitHub 仓库添加 Secrets

进入你的 GitHub 仓库 https://github.com/axzcnzxis/sub2api：
1. 点击 **Settings** -> **Secrets and variables** -> **Actions**
2. 点击 **New repository secret** 添加以下两项：

- CLOUDFLARE_API_TOKEN：你的 Cloudflare API 令牌（需具备 Workers 编辑权限）
- CLOUDFLARE_ACCOUNT_ID：你的 Cloudflare 账户 ID

### 第二步：一键 Run Workflow

1. 点击 GitHub 仓库顶部的 **Actions** 选项卡。
2. 在左侧选择 **Deploy Cloudflare Worker**。
3. 点击右侧 **Run workflow** -> 选择 main 分支 -> 点击 **Run workflow**。
4. 系统将在云端自动完成打包与部署！

---

## 📡 API 兼容接口调用

部署完成后，你将获得一个 Worker 域名：https://sub2api-worker.<your-subdomain>.workers.dev

### 1. OpenAI 兼容接口 (Chat Completions)
- **Endpoint**: https://sub2api-worker.<your-subdomain>.workers.dev/v1/chat/completions
- **Headers**: Authorization: Bearer <your-sub2api-key>

### 2. Anthropic Claude 兼容接口 (Messages)
- **Endpoint**: https://sub2api-worker.<your-subdomain>.workers.dev/v1/messages
- **Headers**: x-api-key: <your-sub2api-key> 或 Authorization: Bearer <your-sub2api-key>

---

## 📄 免责声明与开源协议

- 本项目仅供技术学习与研究使用。
- 采用 [GNU Lesser General Public License v3.0](LICENSE) 开源协议。