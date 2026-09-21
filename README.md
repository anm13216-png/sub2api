# Sub2API (Cloudflare Native Serverless Edition)

[![Deploy to Cloudflare Worker](https://github.com/axzcnzxis/sub2api/actions/workflows/deploy-cloudflare.yml/badge.svg)](https://github.com/axzcnzxis/sub2api/actions/workflows/deploy-cloudflare.yml)
[![Version: v0.1.0.10](https://img.shields.io/badge/version-v0.1.0.10-orange.svg)](https://github.com/axzcnzxis/sub2api)
[![License: LGPL v3](https://img.shields.io/badge/License-LGPL_v3-blue.svg)](LICENSE)

> **当前版本**：v0.1.0.10（测试版）  
> **版本命名规范**：测试版前缀为 v（例如：v0.1.0.10），正式版前缀为 vr（例如：vr1.0.0）。

**Sub2API (Cloudflare Native)** 是基于 Cloudflare Serverless 全家桶重构的开源 AI API 网关与订阅配额调度平台。

零服务器成本（100% Free Tier 可运行），支持将 Claude Pro/Team、OpenAI ChatGPT、Gemini、Grok 等订阅账号转为标准 OpenAI / Anthropic 兼容 API 接口，并自动调度与负载均衡。

---

## 📌 项目维护与更新源说明

本项目为全新的 Cloudflare Serverless 架构分支，**所有后续版本更新与代码拉取均来自本项目仓库**：
- **官方仓库**: [https://github.com/axzcnzxis/sub2api](https://github.com/axzcnzxis/sub2api)
- 请务必从 xzcnzxis/sub2api 拉取最新更新，勿直接混用上游原版 Docker/Go 仓库。

---

## 🚀 核心架构与特性

- **纯边缘计算 (Cloudflare Workers + Hono.js)**：全局极低延迟，基于 Web Standard Stream 的高性流式响应 (SSE) 代理。
- **边缘数据库 (Cloudflare D1)**：轻量级 SQLite 边缘数据库，存储用户、密钥与账号关联。
- **毫秒级缓存与退避 (Cloudflare KV)**：记录 API Key 鉴权与上游 429 速率限制冷却标记，实现智能故障转移与退避（Cooldown）。
- **零成本前端 (Cloudflare Pages)**：Vue 3 控制台全自动化免费托管。
- **全自动 CI/CD (GitHub Actions)**：无需本地配置 Node.js 或 Wrangler 环境，在 GitHub 页面点击 **Run workflow** 即可全自动一键部署上云！

---

## 🛠️ 自动化部署指南 (GitHub Actions 推荐)

### 第一步：创建 Cloudflare API Token

登录 [Cloudflare 控制台 API 令牌页面](https://dash.cloudflare.com/profile/api-tokens)：

1. 点击 **创建令牌 (Create Token)** -> 拉到最底部点击 **创建自定义令牌 (Create Custom Token)**。
2. 填入令牌名称（例如 cf-sub2api）。
3. 在 **权限 (Permissions)** 中依次添加以下 3 项权限：
   - **帐户** | **Workers 脚本** | **编辑**
   - **帐户** | **Workers KV 存储** | **编辑**
   - **帐户** | **D1** | **编辑**
4. 在 **帐户资源 (Account Resources)** 中选择 包括 -> 所有帐户。
5. 点击 **继续以预览** -> **创建令牌** 并复制生成的 Token 字符串。

---

### 第二步：在 GitHub 仓库配置 Secrets

进入你的 GitHub 仓库 [https://github.com/axzcnzxis/sub2api](https://github.com/axzcnzxis/sub2api)：
1. 点击 **Settings** -> **Secrets and variables** -> **Actions**。
2. 点击 **New repository secret** 添加以下两项：

| Secret 名称 | 填写内容 / 说明 |
| :--- | :--- |
| CLOUDFLARE_API_TOKEN | 第一步创建并复制的 Cloudflare API Token |
| CLOUDFLARE_ACCOUNT_ID | Cloudflare 控制台首页右侧面板展示的 **Account ID（账户 ID）** |

---

### 第三步：一键 Run Workflow 全自动部署

1. 打开 GitHub 仓库顶部的 **Actions** 选项卡。
2. 在左侧菜单点击 **Deploy Cloudflare Worker**。
3. 点击右侧 **Run workflow** -> 选择 main 分支 -> 点击绿色 **Run workflow** 按钮。
4. 系统将在 GitHub Actions 云端全自动完成依赖安装、Worker 脚本打包并部署至你的 Cloudflare 账户！

---

## 🔧 常见部署问题修复说明

### 依赖冲突问题 (npm peer-dependency ERESOLVE)

如在 GitHub Actions 构建日志中遇到 @cloudflare/workers-types 与 wrangler 的同级依赖冲突报错（xit code 1），本项目已采用**标准依赖规范方案**完成根治：
- worker/package.json 中的 @cloudflare/workers-types 锁定为与 wrangler@^3.90.0 兼容的 ^4.20241106.0 版本。
- 无需开启 --legacy-peer-deps 即可顺利完成打包与发布。

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
