import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

/** 将数据库行序列化为 API 响应格式 */
function serialize(q) {
  return {
    id: q.id,
    userId: q.userId,
    metadata: {
      module: q.module,
      submodule: q.submodule,
      questionType: q.questionType,
      difficulty: q.difficulty,
      tags: JSON.parse(q.tags || '[]'),
      frequency: q.frequency,
      year: q.year,
    },
    question: {
      stem: q.stem,
      options: JSON.parse(q.options || '[]'),
      correctAnswer: q.correctAnswer,
    },
    analysis: {
      breakthrough: q.breakthrough,
      correctAnalysis: q.correctAnalysis,
      trapAnalysis: q.trapAnalysis ? JSON.parse(q.trapAnalysis) : null,
      methodSummary: q.methodSummary,
      examTips: q.examTips,
    },
    analysisSource: q.analysisSource,
    aiModel: q.aiModel,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  };
}

/**
 * GET /api/questions/stats/summary — 数据看板统计
 * 注意：此路由必须在 /:id 之前注册
 */
router.get('/stats/summary', async (req, res, next) => {
  try {
    const where = { userId: req.userId };
    const [total, moduleCounts, difficultyCounts, submoduleCounts] = await Promise.all([
      prisma.question.count({ where }),
      prisma.question.groupBy({ by: ['module'], where, _count: { id: true } }),
      prisma.question.groupBy({ by: ['difficulty'], where, _count: { id: true } }),
      prisma.question.groupBy({ by: ['submodule'], where, _count: { id: true } }),
    ]);

    res.json({
      total,
      byModule: moduleCounts.map((m) => ({ module: m.module, count: m._count.id })),
      byDifficulty: difficultyCounts.map((d) => ({ difficulty: d.difficulty, count: d._count.id })),
      bySubmodule: submoduleCounts.map((s) => ({ submodule: s.submodule, count: s._count.id })),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/questions — 分页列表 + 多维筛选
 * query: module, submodule, difficulty, q(关键词搜索), page, pageSize
 */
router.get('/', async (req, res, next) => {
  try {
    const { module, submodule, difficulty, q: search, page = 1, pageSize = 50 } = req.query;
    const where = { userId: req.userId };
    if (module) where.module = module;
    if (submodule) where.submodule = submodule;
    if (difficulty) where.difficulty = parseInt(difficulty);
    if (search) where.stem = { contains: search };

    const pNum = parseInt(page);
    const psNum = parseInt(pageSize);
    const [items, total] = await Promise.all([
      prisma.question.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pNum - 1) * psNum,
        take: psNum,
      }),
      prisma.question.count({ where }),
    ]);

    res.json({
      items: items.map(serialize),
      total,
      page: pNum,
      pageSize: psNum,
      totalPages: Math.ceil(total / psNum),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/questions/:id — 单题详情
 */
router.get('/:id', async (req, res, next) => {
  try {
    const question = await prisma.question.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!question) {
      return res.status(404).json({ error: '题目不存在' });
    }
    res.json(serialize(question));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/questions — 创建题目
 */
router.post('/', async (req, res, next) => {
  try {
    const d = req.body;
    if (!d.question?.stem) {
      return res.status(400).json({ error: '题干不能为空' });
    }

    const meta = d.metadata || {};
    const que = d.question || {};

    const question = await prisma.question.create({
      data: {
        userId: req.userId,
        module: meta.module || '行测',
        submodule: meta.submodule || '',
        questionType: meta.questionType || '',
        difficulty: meta.difficulty || 3,
        tags: JSON.stringify(meta.tags || []),
        frequency: meta.frequency || '中频',
        year: meta.year || null,
        stem: que.stem || '',
        options: JSON.stringify(que.options || []),
        correctAnswer: que.correctAnswer || '',
        breakthrough: d.analysis?.breakthrough || null,
        correctAnalysis: d.analysis?.correctAnalysis || null,
        trapAnalysis: d.analysis?.trapAnalysis ? JSON.stringify(d.analysis.trapAnalysis) : null,
        methodSummary: d.analysis?.methodSummary || null,
        examTips: d.analysis?.examTips || null,
        analysisSource: d.analysisSource || 'manual',
        aiModel: d.aiModel || null,
      },
    });

    res.status(201).json(serialize(question));
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/questions/:id — 更新题目
 */
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.question.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: '题目不存在' });
    }

    const d = req.body;
    const meta = d.metadata || {};
    const que = d.question || {};
    const updateFields = {};

    const scalarFields = [
      'module', 'submodule', 'questionType', 'difficulty', 'frequency',
      'year', 'stem', 'correctAnswer', 'breakthrough', 'correctAnalysis',
      'methodSummary', 'examTips', 'analysisSource', 'aiModel',
    ];
    for (const f of scalarFields) {
      if (meta[f] !== undefined) updateFields[f] = meta[f];
      if (que[f] !== undefined) updateFields[f] = que[f];
      if (d[f] !== undefined) updateFields[f] = d[f];
    }
    if (meta.tags !== undefined) updateFields.tags = JSON.stringify(meta.tags);
    if (que.options !== undefined) updateFields.options = JSON.stringify(que.options);
    if (d.analysis?.trapAnalysis !== undefined) {
      updateFields.trapAnalysis = JSON.stringify(d.analysis.trapAnalysis);
    }

    const question = await prisma.question.update({
      where: { id: parseInt(req.params.id) },
      data: updateFields,
    });

    res.json(serialize(question));
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/questions/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.question.findFirst({
      where: { id: parseInt(req.params.id), userId: req.userId },
    });
    if (!existing) {
      return res.status(404).json({ error: '题目不存在' });
    }
    await prisma.question.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
