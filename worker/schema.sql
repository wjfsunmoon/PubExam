-- PubExam D1 数据库 Schema
-- 运行: npx wrangler d1 execute pubexam --file=worker/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,           -- PBKDF2 哈希: base64(salt):base64(hash)
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS questions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,

  -- 元数据
  module        TEXT NOT NULL,
  submodule     TEXT DEFAULT '',
  question_type TEXT DEFAULT '',
  difficulty    INTEGER DEFAULT 3,
  tags          TEXT DEFAULT '[]',     -- JSON array string
  frequency     TEXT DEFAULT '中频',
  year          TEXT,

  -- 题目内容
  stem          TEXT NOT NULL,
  options       TEXT DEFAULT '[]',     -- JSON array string
  correct_answer TEXT DEFAULT '',

  -- 结构化解析
  breakthrough     TEXT,
  correct_analysis  TEXT,
  trap_analysis    TEXT,               -- JSON array string
  method_summary   TEXT,
  exam_tips        TEXT,

  -- AI 元数据
  analysis_source  TEXT,                -- ai / manual / template
  ai_model         TEXT,

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_module_sub ON questions(module, submodule);
