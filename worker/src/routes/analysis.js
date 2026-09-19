import { Hono } from 'hono';
import { authMiddleware } from '../lib/auth.js';
import { analyzeQuestion } from '../services/ai.js';

const router = new Hono();
router.use('*', authMiddleware());

/** GET /api/analysis/status */
router.get('/status', (c) => {
  const configured = !!c.env.OPENAI_API_KEY;
  return c.json({
    aiEnabled: configured,
    model: configured ? (c.env.OPENAI_MODEL || 'gpt-4o') : null,
    mode: configured ? 'ai' : 'template',
  });
});

/** POST /api/analysis/generate */
router.post('/generate', async (c) => {
  const questionData = await c.req.json();
  const que = questionData.question || {};
  if (!que.stem || !que.correctAnswer) {
    return c.json({ error: '题干和正确答案不能为空' }, 400);
  }

  const analysis = await analyzeQuestion(questionData, c.env);
  return c.json(analysis);
});

export default router;
