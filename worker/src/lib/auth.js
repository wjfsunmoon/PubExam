import { SignJWT, jwtVerify } from 'jose';

/**
 * 认证工具库 —— Cloudflare Workers 兼容
 * - JWT: jose 库（基于 Web Crypto API）
 * - 密码哈希: PBKDF2-SHA256（Web Crypto API，Workers 原生支持）
 */

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

const PBKDF2_ITERATIONS = 100000;
const HASH_LENGTH = 256; // bits
const SALT_LENGTH = 16;  // bytes

/** 生成随机盐值 */
function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/** Uint8Array → base64 字符串 */
function toBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** base64 字符串 → Uint8Array */
function fromBase64(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** 密码哈希（PBKDF2-SHA256），返回 "base64(salt):base64(hash)" */
export async function hashPassword(password) {
  const salt = generateSalt();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    ENCODER.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    HASH_LENGTH
  );
  return `${toBase64(salt)}:${toBase64(new Uint8Array(hashBuffer))}`;
}

/** 验证密码 */
export async function verifyPassword(password, stored) {
  try {
    const [saltB64, hashB64] = stored.split(':');
    if (!saltB64 || !hashB64) return false;

    const salt = fromBase64(saltB64);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      ENCODER.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const hashBuffer = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      HASH_LENGTH
    );
    return toBase64(new Uint8Array(hashBuffer)) === hashB64;
  } catch {
    return false;
  }
}

/** 签发 JWT */
export async function signJWT(payload, secret, expiresIn = '7d') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(ENCODER.encode(secret));
}

/** 验证 JWT，返回 payload 或 null */
export async function verifyJWT(token, secret) {
  try {
    const { payload } = await jwtVerify(token, ENCODER.encode(secret));
    return payload;
  } catch {
    return null;
  }
}

/** Hono JWT 鉴权中间件（从 c.env.JWT_SECRET 读取密钥）*/
export function authMiddleware() {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: '未登录，请先登录' }, 401);
    }
    const token = authHeader.slice(7);
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    if (!payload) {
      return c.json({ error: '登录已过期，请重新登录' }, 401);
    }
    c.set('userId', payload.userId);
    await next();
  };
}
