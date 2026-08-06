-- ════════════════════════════════════════════════════
-- 共创计划功能：建表 + published 字段
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
  published boolean DEFAULT FALSE,
  created_at timestamptz DEFAULT NOW()
);

-- 若表已存在但缺少 published 列，执行下面这行
ALTER TABLE cocreation ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE;
