import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth.js';
import questionRoutes from './routes/questions.js';
import analysisRoutes from './routes/analysis.js';
import setupRoutes from './routes/setup.js';

const app = new Hono();

// ── 全局中间件 ──
app.use('*', cors());

// ── 健康检查 ──
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'PubExam API (Cloudflare Workers)',
    timestamp: new Date().toISOString(),
  });
});

// ── 初始化种子数据（首次部署后访问一次）──
app.route('/api', setupRoutes);

// ── API 路由 ──
app.route('/api/auth', authRoutes);
app.route('/api/questions', questionRoutes);
app.route('/api/analysis', analysisRoutes);

// ── API 404 ──
app.all('/api/*', (c) => {
  return c.json({ error: `路由不存在: ${c.req.method} ${c.req.path}` }, 404);
});

// ── 静态资源 SPA fallback ──
// 非 API 请求交给 Cloudflare Static Assets 处理
// wrangler.toml 中 not_found_handling = "single-page-application" 自动返回 index.html
app.get('*', async (c) => {
  return await c.env.ASSETS.fetch(c.req.raw);
});

// ── 全局错误处理 ──
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: err.message || '服务器内部错误' }, 500);
});

export default app;
