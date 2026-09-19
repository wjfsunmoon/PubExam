import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import questionRoutes from './routes/questions.js';
import analysisRoutes from './routes/analysis.js';

dotenv.config();

const app = express();

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDist = join(__dirname, '../../client/dist');

// ── 全局中间件 ──
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── 健康检查 ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PubExam API',
    timestamp: new Date().toISOString(),
  });
});

// ── API 路由 ──
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/questions', questionRoutes);

// ── API 404（仅 /api/* 路径返回 JSON） ──
app.use('/api', (req, res) => {
  res.status(404).json({ error: `路由不存在: ${req.method} ${req.path}` });
});

// ── 静态文件（构建后的 React 前端） ──
app.use(express.static(clientDist));

// ── SPA fallback：所有非 API 路由返回 index.html ──
app.get('*', (req, res) => {
  res.sendFile(join(clientDist, 'index.html'));
});

// ── 全局错误处理 ──
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || '服务器内部错误',
  });
});

// ── 启动 ──
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 PubExam API Server running at http://localhost:${PORT}`);
  console.log(`   AI 模式: ${process.env.OPENAI_API_KEY ? '已启用' : '模板模式（未配置 API Key）'}`);
});
