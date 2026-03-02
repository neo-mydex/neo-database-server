-- Migration 006: ai_chatbot_sessions.id SERIAL → UUID
--
-- 原因：自增整数 id 对外暴露会泄露系统总消息量，且无法在客户端预生成。
-- 改为 gen_random_uuid()，与 session_id 风格统一。
--
-- 操作步骤：
--   1. 添加新列 id_new UUID
--   2. 用 gen_random_uuid() 回填现有行
--   3. 将新列设为 NOT NULL + DEFAULT
--   4. 删除旧 id 列，重命名新列为 id
--   5. 重建主键约束

-- Step 1: 新增 UUID 列
ALTER TABLE ai_chatbot_sessions ADD COLUMN id_new UUID;

-- Step 2: 回填现有行（每行生成唯一 UUID）
UPDATE ai_chatbot_sessions SET id_new = gen_random_uuid();

-- Step 3: 设为 NOT NULL + 默认值
ALTER TABLE ai_chatbot_sessions ALTER COLUMN id_new SET NOT NULL;
ALTER TABLE ai_chatbot_sessions ALTER COLUMN id_new SET DEFAULT gen_random_uuid();

-- Step 4: 删除旧主键约束，删除旧列，重命名新列
ALTER TABLE ai_chatbot_sessions DROP CONSTRAINT ai_chatbot_sessions_pkey;
ALTER TABLE ai_chatbot_sessions DROP COLUMN id;
ALTER TABLE ai_chatbot_sessions RENAME COLUMN id_new TO id;

-- Step 5: 重建主键
ALTER TABLE ai_chatbot_sessions ADD PRIMARY KEY (id);
