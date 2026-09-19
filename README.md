# 考公题目梳理 Agent

> 全栈智能题库系统 —— 基于大语言模型的结构化公考题目解析与沉淀平台

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + Tailwind CSS |
| 后端 | Node.js + Express + Prisma ORM |
| 数据库 | SQLite |
| AI 引擎 | OpenAI 兼容 LLM API + Prompt 工程 |
| 认证 | JWT + bcrypt |

## 功能模块

- **智能解析**: 粘贴题目 → AI 自动生成结构化解析（破题眼 / 正确项分析 / 干扰项排雷 / 方法总结 / 备考提醒）
- **题库管理**: 多模块（行测/申论/公基/面试）题目 CRUD，标签化分类
- **检索筛选**: 按模块、难度、题型、标签多维检索
- **一键导出**: Markdown / JSON 双格式导出，适合题库沉淀
- **数据看板**: 题量统计、难度分布、模块占比可视化

## 快速启动

```bash
# 安装依赖
cd server && npm install && cd ../client && npm install && cd ..

# 初始化数据库
cd server && npx prisma migrate dev && npx prisma db seed && cd ..

# 配置 AI API（可选，不配则使用模板模式）
cp server/.env.example server/.env
# 编辑 .env 填入 OPENAI_API_KEY

# 启动开发服务
npm run dev
```

## 项目结构

```
PubExam/
├── server/               # 后端服务
│   ├── prisma/
│   │   └── schema.prisma # 数据库模型
│   └── src/
│       ├── index.js      # Express 入口
│       ├── routes/       # API 路由
│       ├── middleware/    # JWT 鉴权
│       └── services/     # AI 解析引擎
├── client/               # 前端应用
│   └── src/
│       ├── pages/        # 页面组件
│       ├── components/   # 通用组件
│       └── api/          # API 封装
└── README.md
```
