DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sentiment AS ENUM ('bullish', 'bearish', 'neutral');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE category AS ENUM ('educational', 'tradable', 'macro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE detected_language AS ENUM ('zh-CN', 'en-US', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS ai_processed_content (
  -- 继承自 RawContent 的 11 个字段
  id              VARCHAR(64)        PRIMARY KEY,
  title           VARCHAR(512)       NOT NULL,
  content_type    content_type       NOT NULL,
  content         TEXT               NOT NULL,
  source          VARCHAR(128)       NOT NULL,
  published_at    TIMESTAMPTZ        NOT NULL,
  url             VARCHAR(1024),
  author          VARCHAR(256),
  language        VARCHAR(16),
  images          JSONB,
  social_metrics  JSONB,

  -- AI 新增的 10 个字段
  volatility          NUMERIC(4, 3)      NOT NULL,
  summary             TEXT               NOT NULL,
  evidence_points     JSONB              NOT NULL,
  suggested_questions JSONB              NOT NULL,
  detected_language   detected_language  NOT NULL,
  category            category           NOT NULL,
  risk_level          risk_level         NOT NULL,
  tags                JSONB              NOT NULL,
  suggested_tokens    JSONB,
  -- 结构: [{ symbol, name, relevance_score, sentiment, confidence, chain?, addr? }]
  -- chain: 区块链代号 (eth/sol/arb/bsc/polygon/base/op 等)
  -- addr: 代币地址 (EVM: 0x..., SOL: base58)
  overall_sentiment   sentiment
);

-- 按发布时间排序（推荐系统常用）
CREATE INDEX IF NOT EXISTS idx_ai_processed_content_published_at ON ai_processed_content (published_at DESC);

-- 按分类筛选
CREATE INDEX IF NOT EXISTS idx_ai_processed_content_category ON ai_processed_content (category);

-- 按风险等级筛选
CREATE INDEX IF NOT EXISTS idx_ai_processed_content_risk_level ON ai_processed_content (risk_level);

-- 按情感倾向筛选（仅可交易内容）
CREATE INDEX IF NOT EXISTS idx_ai_processed_content_sentiment ON ai_processed_content (overall_sentiment)
  WHERE overall_sentiment IS NOT NULL;

-- 按波动性排序（推荐系统排序用）
CREATE INDEX IF NOT EXISTS idx_ai_processed_content_volatility ON ai_processed_content (volatility DESC);
