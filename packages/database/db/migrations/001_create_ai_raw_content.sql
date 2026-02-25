DO $$ BEGIN
  CREATE TYPE content_type AS ENUM ('news', 'edu', 'social');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS ai_raw_content (
  id             VARCHAR(64)    PRIMARY KEY,
  title          VARCHAR(512)   NOT NULL,
  content_type   content_type   NOT NULL,
  content        TEXT           NOT NULL,
  source         VARCHAR(128)   NOT NULL,
  published_at   TIMESTAMPTZ    NOT NULL,
  url            VARCHAR(1024),
  author         VARCHAR(256),
  language       VARCHAR(16),
  images         JSONB,
  social_metrics JSONB
);

-- 按发布时间查询（推荐系统常用）
CREATE INDEX IF NOT EXISTS idx_ai_raw_content_published_at ON ai_raw_content (published_at DESC);

-- 按类型筛选
CREATE INDEX IF NOT EXISTS idx_ai_raw_content_content_type ON ai_raw_content (content_type);

-- 按来源筛选
CREATE INDEX IF NOT EXISTS idx_ai_raw_content_source ON ai_raw_content (source);

-- 查询 social 类型中的 KOL 内容
CREATE INDEX IF NOT EXISTS idx_ai_raw_content_is_kol ON ai_raw_content ((social_metrics->>'is_kol'))
  WHERE content_type = 'social';
