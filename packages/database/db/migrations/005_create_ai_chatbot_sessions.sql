CREATE TABLE IF NOT EXISTS ai_chatbot_sessions (
  id          SERIAL        PRIMARY KEY,
  user_id     VARCHAR(64)   NOT NULL REFERENCES ai_user_profiles(user_id) ON DELETE CASCADE,
  session_id  VARCHAR(128)  NOT NULL,
  question    TEXT          NOT NULL,
  answer      TEXT          NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_user_id    ON ai_chatbot_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_session_id ON ai_chatbot_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_created_at ON ai_chatbot_sessions(created_at);

COMMENT ON TABLE ai_chatbot_sessions IS 'AI 对话记录：每行为一条问答，session_id 用于分组成一次会话';
COMMENT ON COLUMN ai_chatbot_sessions.user_id    IS '用户 Privy ID，关联 ai_user_profiles.user_id';
COMMENT ON COLUMN ai_chatbot_sessions.session_id IS '会话 ID，前端生成的 UUID，一次对话共享同一个值';
COMMENT ON COLUMN ai_chatbot_sessions.question   IS '用户提问内容';
COMMENT ON COLUMN ai_chatbot_sessions.answer     IS 'AI 回复内容';
