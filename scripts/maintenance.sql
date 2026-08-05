-- ════════════════════════════════════════════════════
-- 数据维护脚本：去重 + 重新编排ID
-- 在 Neon SQL Editor 中执行
-- ════════════════════════════════════════════════════

-- 1. 查看重复数据（预览，不执行删除）
-- SELECT created_at, content, type, COUNT(*) AS cnt
-- FROM submissions
-- GROUP BY created_at, content, type
-- HAVING COUNT(*) > 1
-- ORDER BY cnt DESC;

-- 2. 删除重复稿件，只保留每组中 ID 最小的一条
DELETE FROM submissions
WHERE id NOT IN (
  SELECT MIN(id)
  FROM submissions
  GROUP BY created_at, content, type
);

-- 3. 重新编排 ID（按 created_at 从远到近）
-- PostgreSQL 不允许直接修改 serial，需要通过临时序列实现
BEGIN;

-- 创建临时映射表
CREATE TEMPORARY TABLE id_remap (
  old_id INT,
  new_id INT
) ON COMMIT DROP;

-- 按时间排序，生成新ID
INSERT INTO id_remap (old_id, new_id)
SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC)
FROM submissions;

-- 先删除所有外键约束（如果有）
-- ALTER TABLE recruit_applicants DROP CONSTRAINT IF EXISTS recruit_applicants_position_id_fkey;

-- 临时禁用序列自增检查
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_pkey;
ALTER TABLE submissions ADD COLUMN temp_id INT;

UPDATE submissions s
SET temp_id = r.new_id
FROM id_remap r
WHERE s.id = r.old_id;

-- 更新引用（如果有外键）
-- UPDATE recruit_applicants SET position_id = r.new_id FROM id_remap r WHERE recruit_applicants.position_id = r.old_id;

-- 删除旧ID，重命名
ALTER TABLE submissions DROP COLUMN id;
ALTER TABLE submissions RENAME COLUMN temp_id TO id;
ALTER TABLE submissions ADD PRIMARY KEY (id);

-- 重置序列
SELECT setval('submissions_id_seq', (SELECT MAX(id) FROM submissions));

COMMIT;

-- 4. 验证结果
-- SELECT id, created_at, type, LEFT(content, 30) AS content_preview
-- FROM submissions
-- ORDER BY id ASC
-- LIMIT 20;
