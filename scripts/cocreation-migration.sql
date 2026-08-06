-- ════════════════════════════════════════════════════
-- 共创计划功能：建表
-- 在 Neon SQL Editor 中执行
-- ════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cocreation (
  id serial PRIMARY KEY,
  people_count integer NOT NULL,
  media_type varchar(50) NOT NULL,
  roles jsonb NOT NULL DEFAULT '{}',
  accounts jsonb NOT NULL DEFAULT '{}',
  confirmed boolean DEFAULT FALSE,
  verification_code varchar(6) NOT NULL,
  created_at timestamptz DEFAULT NOW()
);
