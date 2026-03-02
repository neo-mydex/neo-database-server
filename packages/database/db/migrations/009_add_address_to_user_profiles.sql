-- 009_add_address_to_user_profiles.sql
-- 给 ai_user_profiles 表新增 evm_address 和 sol_address 字段
-- 允许 NULL 以兼容存量老数据

ALTER TABLE ai_user_profiles
  ADD COLUMN IF NOT EXISTS evm_address VARCHAR(42),
  ADD COLUMN IF NOT EXISTS sol_address VARCHAR(44);
