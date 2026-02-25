CREATE TABLE IF NOT EXISTS ai_user_profiles (
  user_id          VARCHAR(64)   PRIMARY KEY,
  risk_appetite    NUMERIC(4,1)  NOT NULL DEFAULT 5.0 CHECK (risk_appetite BETWEEN 1 AND 10),
  patience         NUMERIC(4,1)  NOT NULL DEFAULT 5.0 CHECK (patience BETWEEN 1 AND 10),
  info_sensitivity NUMERIC(4,1)  NOT NULL DEFAULT 5.0 CHECK (info_sensitivity BETWEEN 1 AND 10),
  decision_speed   NUMERIC(4,1)  NOT NULL DEFAULT 5.0 CHECK (decision_speed BETWEEN 1 AND 10),
  cat_type         VARCHAR(32)   NOT NULL DEFAULT '均衡的全能喵',
  cat_desc         TEXT          NOT NULL DEFAULT '你的命格最为均衡，没有明显短板也没有突出长板。这份平衡本身就是一种天赋。',
  registered_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  trade_count      INT           NOT NULL DEFAULT 0 CHECK (trade_count >= 0)
);

COMMENT ON TABLE ai_user_profiles IS 'AI 用户画像：4个维度（1-10分）+ 对应的猫角色和描述 + 注册时间 + 交易次数';
COMMENT ON COLUMN ai_user_profiles.risk_appetite IS '风险偏好：1-10，1=保守，10=激进';
COMMENT ON COLUMN ai_user_profiles.patience IS '耐心度：1-10，1=速读党，10=深度阅读';
COMMENT ON COLUMN ai_user_profiles.info_sensitivity IS '信息敏感：1-10，1=看热点，10=看数据/技术细节';
COMMENT ON COLUMN ai_user_profiles.decision_speed IS '决策速度：1-10，1=慢慢来，10=秒冲';
COMMENT ON COLUMN ai_user_profiles.cat_type IS '对应的猫角色名称，如"迷糊的散步喵"';
COMMENT ON COLUMN ai_user_profiles.cat_desc IS '猫角色的宿命评语';
COMMENT ON COLUMN ai_user_profiles.registered_at IS '用户注册时间（猫的年龄天数）';
COMMENT ON COLUMN ai_user_profiles.trade_count IS '用户在本平台用AI参与的成功交易次数';
