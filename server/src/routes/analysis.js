import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { analyzeQuestion } from '../services/ai.js';

const router = Router();
router.use(authenticate);

/**
 * GET /api/analysis/status — 检查 AI 引擎状态
 */
router.get('/status', (req, res) => {
  const configured = !!process.env.OPENAI_API_KEY;
  res.json({
    aiEnabled: configured,
    model: configured ? process.env.OPENAI_MODEL || 'gpt-4o' : null,
    mode: configured ? 'ai' : 'template',
  });
});

/**
 * POST /api/analysis/generate — 生成结构化解析
 * body: { metadata, question } — 题目数据
 * returns: { breakthrough, correctAnalysis, trapAnalysis, methodSummary, examTips, analysisSource, aiModel }
 */
router.post('/generate', async (req, res, next) => {
  try {
    const questionData = req.body;
    const que = questionData.question || {};
    if (!que.stem || !que.correctAnswer) {
      return res.status(400).json({ error: '题干和正确答案不能为空' });
    }

    const analysis = await analyzeQuestion(questionData);
    res.json(analysis);
  } catch (err) {
    console.error('Analysis error:', err.message);
    res.status(500).json({ error: `解析生成失败: ${err.message}` });
  }
});

export default router;
