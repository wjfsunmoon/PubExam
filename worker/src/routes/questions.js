import { Hono } from 'hono';
import { authMiddleware } from '../lib/auth.js';

const router = new Hono();
router.use('*', authMiddleware());

/** 序列化 DB 行 → API 响应（与 Express 版格式完全一致，前端无需改动） */
function serialize(q) {
  return {
    id: q.id,
    userId: q.user_id,
    metadata: {
      module: q.module,
      submodule: q.submodule,
      questionType: q.question_type,
      difficulty: q.difficulty,
      tags: JSON.parse(q.tags || '[]'),
      frequency: q.frequency,
      year: q.year,
    },
    question: {
      stem: q.stem,
      options: JSON.parse(q.options || '[]'),
      correctAnswer: q.correct_answer,
    },
    analysis: {
      breakthrough: q.breakthrough,
      correctAnalysis: q.correct_analysis,
      trapAnalysis: q.trap_analysis ? JSON.parse(q.trap_analysis) : null,
      methodSummary: q.method_summary,
      examTips: q.exam_tips,
    },
    analysisSource: q.analysis_source,
    aiModel: q.ai_model,
    createdAt: q.created_at,
    updatedAt: q.updated_at,
  };
}

/** GET /api/questions/stats/summary */
router.get('/stats/summary', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;

  const [total, byModule, byDifficulty, bySubmodule] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM questions WHERE user_id = ?').bind(userId).first(),
    db.prepare('SELECT module, COUNT(*) as count FROM questions WHERE user_id = ? GROUP BY module').bind(userId).all(),
    db.prepare('SELECT difficulty, COUNT(*) as count FROM questions WHERE user_id = ? GROUP BY difficulty').bind(userId).all(),
    db.prepare('SELECT submodule, COUNT(*) as count FROM questions WHERE user_id = ? GROUP BY submodule').bind(userId).all(),
  ]);

  return c.json({
    total: total.count,
    byModule: byModule.results.map((m) => ({ module: m.module, count: m.count })),
    byDifficulty: byDifficulty.results.map((d) => ({ difficulty: d.difficulty, count: d.count })),
    bySubmodule: bySubmodule.results.map((s) => ({ submodule: s.submodule, count: s.count })),
  });
});

/** GET /api/questions — 分页列表 + 多维筛选 */
router.get('/', async (c) => {
  const userId = c.get('userId');
  const { module, submodule, difficulty, q: search, page = 1, pageSize = 50 } = c.req.query();

  let sql = 'SELECT * FROM questions WHERE user_id = ?';
  const params = [userId];

  if (module) { sql += ' AND module = ?'; params.push(module); }
  if (submodule) { sql += ' AND submodule = ?'; params.push(submodule); }
  if (difficulty) { sql += ' AND difficulty = ?'; params.push(parseInt(difficulty)); }
  if (search) { sql += ' AND stem LIKE ?'; params.push(`%${search}%`); }

  // Count query (without ORDER/LIMIT)
  let countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
  const countResult = await c.env.DB.prepare(countSql).bind(...params).first();

  // Pagination
  const pNum = parseInt(page);
  const psNum = parseInt(pageSize);
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(psNum, (pNum - 1) * psNum);

  const result = await c.env.DB.prepare(sql).bind(...params).all();

  return c.json({
    items: result.results.map(serialize),
    total: countResult.count,
    page: pNum,
    pageSize: psNum,
    totalPages: Math.ceil(countResult.count / psNum),
  });
});

/** GET /api/questions/:id */
router.get('/:id', async (c) => {
  const userId = c.get('userId');
  const question = await c.env.DB.prepare('SELECT * FROM questions WHERE id = ? AND user_id = ?')
    .bind(parseInt(c.req.param('id')), userId)
    .first();

  if (!question) {
    return c.json({ error: '题目不存在' }, 404);
  }
  return c.json(serialize(question));
});

/** POST /api/questions */
router.post('/', async (c) => {
  const userId = c.get('userId');
  const d = await c.req.json();
  const meta = d.metadata || {};
  const que = d.question || {};
  const an = d.analysis || {};

  const result = await c.env.DB.prepare(
    `INSERT INTO questions (
      user_id, module, submodule, question_type, difficulty, tags, frequency, year,
      stem, options, correct_answer,
      breakthrough, correct_analysis, trap_analysis, method_summary, exam_tips,
      analysis_source, ai_model
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    userId,
    meta.module || '行测',
    meta.submodule || '',
    meta.questionType || '',
    meta.difficulty || 3,
    JSON.stringify(meta.tags || []),
    meta.frequency || '中频',
    meta.year || null,
    que.stem || '',
    JSON.stringify(que.options || []),
    que.correctAnswer || '',
    an.breakthrough || null,
    an.correctAnalysis || null,
    an.trapAnalysis ? JSON.stringify(an.trapAnalysis) : null,
    an.methodSummary || null,
    an.examTips || null,
    d.analysisSource || 'manual',
    d.aiModel || null,
  ).run();

  const question = await c.env.DB.prepare('SELECT * FROM questions WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();

  return c.json(serialize(question), 201);
});

/** PUT /api/questions/:id */
router.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));

  const existing = await c.env.DB.prepare('SELECT id FROM questions WHERE id = ? AND user_id = ?')
    .bind(id, userId).first();
  if (!existing) {
    return c.json({ error: '题目不存在' }, 404);
  }

  const d = await c.req.json();
  const meta = d.metadata || {};
  const que = d.question || {};
  const an = d.analysis || {};

  const result = await c.env.DB.prepare(
    `UPDATE questions SET
      module = ?, submodule = ?, question_type = ?, difficulty = ?, tags = ?, frequency = ?, year = ?,
      stem = ?, options = ?, correct_answer = ?,
      breakthrough = ?, correct_analysis = ?, trap_analysis = ?, method_summary = ?, exam_tips = ?,
      analysis_source = ?, ai_model = ?,
      updated_at = datetime('now')
    WHERE id = ? AND user_id = ?`
  ).bind(
    meta.module || '行测',
    meta.submodule || '',
    meta.questionType || '',
    meta.difficulty || 3,
    JSON.stringify(meta.tags || []),
    meta.frequency || '中频',
    meta.year || null,
    que.stem || '',
    JSON.stringify(que.options || []),
    que.correctAnswer || '',
    an.breakthrough || null,
    an.correctAnalysis || null,
    an.trapAnalysis ? JSON.stringify(an.trapAnalysis) : null,
    an.methodSummary || null,
    an.examTips || null,
    d.analysisSource || 'manual',
    d.aiModel || null,
    id, userId,
  ).run();

  const question = await c.env.DB.prepare('SELECT * FROM questions WHERE id = ?').bind(id).first();
  return c.json(serialize(question));
});

/** DELETE /api/questions/:id */
router.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const existing = await c.env.DB.prepare('SELECT id FROM questions WHERE id = ? AND user_id = ?')
    .bind(parseInt(c.req.param('id')), userId).first();
  if (!existing) {
    return c.json({ error: '题目不存在' }, 404);
  }

  await c.env.DB.prepare('DELETE FROM questions WHERE id = ?')
    .bind(parseInt(c.req.param('id'))).run();

  return c.json({ success: true });
});

export default router;
