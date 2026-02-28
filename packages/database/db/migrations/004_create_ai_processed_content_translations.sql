-- 翻译表：存储 ai_processed_content 的多语言版本
-- 注意：zh-CN（原文）不存此表，只存 en-US / ja-JP / ko-KR

CREATE TABLE IF NOT EXISTS ai_processed_content_translations (
  id                  SERIAL PRIMARY KEY,
  content_id          VARCHAR NOT NULL REFERENCES ai_processed_content(id) ON DELETE CASCADE,
  lang                VARCHAR(10) NOT NULL,  -- 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR'
  title               TEXT NOT NULL,
  summary             TEXT NOT NULL,
  content             TEXT,                  -- 翻译后的正文，NULL 时 fallback 到原文
  evidence_points     JSONB NOT NULL DEFAULT '[]',
  tags                JSONB NOT NULL DEFAULT '[]',
  suggested_questions JSONB NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (content_id, lang)
);

CREATE INDEX IF NOT EXISTS idx_translations_content_lang
  ON ai_processed_content_translations (content_id, lang);
