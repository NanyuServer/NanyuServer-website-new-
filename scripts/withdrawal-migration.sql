-- ════════════════════════════════════════════════════
-- 当事人撤稿功能：建表 + 字段迁移
-- 在 Neon SQL Editor 中执行
-- ════════════════════════════════════════════════════

-- 1. submissions 表增加 hidden 字段（默认 false）
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE;

-- 2. 撤稿记录表
CREATE TABLE IF NOT EXISTS withdrawals (
  id serial PRIMARY KEY,
  submission_id integer NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  submission_content text NOT NULL,
  qq_number varchar(64) NOT NULL,
  created_at timestamptz DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_withdrawals_submission ON withdrawals(submission_id);
