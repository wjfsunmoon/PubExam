# Cloudflare 部署指南

> 将考公题目梳理 Agent 完整部署到 Cloudflare（Workers + D1 + Pages Static Assets）
> 全程免费，一个域名同时服务 API + 前端

---

## 架构总览

```
用户浏览器
    ↓
Cloudflare Workers (Hono)
    ├── /api/*  → Hono 路由处理（D1 查询 + AI 解析）
    └── /*      → 静态资源（React 构建产物，SPA fallback）
                    ↓
              Cloudflare D1 (SQLite)
              ├── users 表
              └── questions 表
```

| 组件 | Cloudflare 服务 | 费用 |
|------|----------------|------|
| 后端 API | Cloudflare Workers | 免费（10万次/天） |
| 前端 | Workers Static Assets | 免费 |
| 数据库 | Cloudflare D1 | 免费（5GB） |
| AI 解析 | OpenAI API（自配 Key） | 按用量付费，不配则模板模式 |

---

## 部署步骤（按顺序执行）

### 第 0 步：安装依赖

```bash
cd /home/wjfsu/PubExam/worker
npm install --cache /tmp/.npm-cache
```

### 第 1 步：登录 Cloudflare

```bash
npx wrangler login
```

浏览器会弹出 Cloudflare 授权页面，点击允许。

### 第 2 步：创建 D1 数据库

```bash
npx wrangler d1 create pubexam
```

输出会显示 `database_id`，**复制它**，格式类似：
```
✅ Successfully created DB 'pubexam'
Created your new D1 database.
[[d1_databases]]
binding = "DB"
database_name = "pubexam"
database_id = "xxxx-xxxx-xxxx-xxxx"    ← 复制这个 ID
```

### 第 3 步：更新 wrangler.toml

打开 `worker/wrangler.toml`，把 `REPLACE_WITH_YOUR_DATABASE_ID` 替换为第 2 步获取的 ID：

```toml
[[d1_databases]]
binding = "DB"
database_name = "pubexam"
database_id = "你的真实ID"     ← 替换这里
```

### 第 4 步：初始化数据库表

```bash
npx wrangler d1 execute pubexam --remote --file=worker/schema.sql
```

这会在 D1 中创建 users 和 questions 表。

### 第 5 步：设置密钥

```bash
# JWT 密钥（必填）
npx wrangler secret put JWT_SECRET
# 输入一个随机字符串，如：my-super-secret-key-2024

# OpenAI API Key（选填，不配则模板模式）
npx wrangler secret put OPENAI_API_KEY
# 输入你的 OpenAI API Key，或留空跳过
```

### 第 6 步：构建前端

```bash
cd /home/wjfsu/PubExam/client
npm run build
# 产物输出到 client/dist/
cd ..
```

### 第 7 步：部署

```bash
cd worker
npx wrangler deploy
```

输出会显示你的线上地址：
```
Deployed pubexam triggers (xx.xx sec)
  https://pubexam.<你的子域>.workers.dev
```

### 第 8 步：初始化种子数据

浏览器打开你的部署地址 + `/api/setup`：

```
https://pubexam.<你的子域>.workers.dev/api/setup
```

看到 JSON 响应表示成功：
```json
{
  "success": true,
  "message": "数据库初始化完成",
  "login": "demo / demo123"
}
```

### 第 9 步：访问网站 🎉

```
https://pubexam.<你的子域>.workers.dev
```

演示账号：`demo` / `demo123`

---

## 日常维护

### 修改代码后重新部署

```bash
cd /home/wjfsu/PubExam

# 改了前端
cd client && npm run build && cd ..

# 改了后端 Worker（或前端）
cd worker && npx wrangler deploy
```

### 查看数据库内容

```bash
cd worker

# 查看所有题目
npx wrangler d1 execute pubexam --remote --command "SELECT id, module, submodule FROM questions"

# 查看用户
npx wrangler d1 execute pubexam --remote --command "SELECT id, username FROM users"
```

### 本地开发调试

```bash
cd worker
npx wrangler dev
# 本地启动 Worker + 本地 D1，访问 http://localhost:8787
# 首次需要本地初始化:
# npx wrangler d1 execute pubexam --local --file=schema.sql
# 然后访问 http://localhost:8787/api/setup
```

### 绑定自定义域名（可选）

在 Cloudflare Dashboard → Workers & Pages → pubexam → Settings → Triggers → Custom Domains 中添加你的域名。

---

## 常见问题

| 问题 | 解决方案 |
|------|---------|
| 部署报错 database_id | 检查 wrangler.toml 中的 database_id 是否已替换 |
| `/api/setup` 报 401 | setup 路由不需要认证，检查是否路由冲突 |
| 前端白屏 | 确认 client/dist/ 已构建（第 6 步） |
| AI 解析显示"模板模式" | 未配置 OPENAI_API_KEY，运行第 5 步 |
| Workers 请求超时 | 免费版 CPU 时间限制 10ms，AI 调用可能超时，考虑升级或改异步 |

---

## 技术栈变更对照

| 原 Express 版 | Cloudflare Workers 版 | 变更原因 |
|---------------|----------------------|---------|
| Express | **Hono** | Workers 不支持 Node.js 运行时，Hono 是 Workers 原生框架 |
| Prisma + SQLite 文件 | **D1 直接查询** | D1 是 Cloudflare 的 serverless SQLite，Workers 无文件系统 |
| jsonwebtoken | **jose** | jsonwebtoken 依赖 Node crypto，jose 基于 Web Crypto API |
| bcryptjs | **PBKDF2 (Web Crypto)** | bcrypt 依赖 Node crypto，Workers 只有 Web Crypto API |
| fetch (调 LLM) | **fetch (Workers 原生)** | 零改动，Workers 原生支持 fetch |
| express.static + SPA | **Workers Static Assets** | Cloudflare 内置静态资源服务 + SPA fallback |
