import { Hono } from 'hono';
import { hashPassword, verifyPassword, signJWT } from '../lib/auth.js';

const router = new Hono();

/**
 * POST /api/auth/register
 */
router.post('/register', async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) {
    return c.json({ error: '用户名和密码不能为空' }, 400);
  }
  if (username.length < 2 || username.length > 20) {
    return c.json({ error: '用户名长度 2-20 个字符' }, 400);
  }
  if (password.length < 6) {
    return c.json({ error: '密码至少 6 位' }, 400);
  }

  // Check existing user
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE username = ?')
    .bind(username)
    .first();
  if (existing) {
    return c.json({ error: '用户名已存在' }, 409);
  }

  const hashed = await hashPassword(password);
  const result = await c.env.DB.prepare('INSERT INTO users (username, password) VALUES (?, ?)')
    .bind(username, hashed)
    .run();

  const token = await signJWT({ userId: result.meta.last_row_id }, c.env.JWT_SECRET, c.env.JWT_EXPIRES_IN);

  return c.json({
    token,
    user: { id: result.meta.last_row_id, username },
  }, 201);
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) {
    return c.json({ error: '用户名和密码不能为空' }, 400);
  }

  const user = await c.env.DB.prepare('SELECT id, username, password FROM users WHERE username = ?')
    .bind(username)
    .first();
  if (!user) {
    return c.json({ error: '用户名或密码错误' }, 401);
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return c.json({ error: '用户名或密码错误' }, 401);
  }

  const token = await signJWT({ userId: user.id }, c.env.JWT_SECRET, c.env.JWT_EXPIRES_IN);

  return c.json({
    token,
    user: { id: user.id, username: user.username },
  });
});

export default router;
