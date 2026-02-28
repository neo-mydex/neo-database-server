/**
 * AI 聊天机器人会话相关类型定义
 * 对应数据库表：ai_chatbot_sessions
 */

/**
 * 单条对话记录
 */
export interface ChatbotMessage {
  id: number
  user_id: string       // Privy ID，如 did:privy:xxx
  session_id: string    // 会话 UUID，前端生成
  question: string
  answer: string
  created_at: number    // Unix 毫秒时间戳
  updated_at: number    // Unix 毫秒时间戳
}

/**
 * 创建消息的输入（user_id 由服务端从 JWT 注入，不接受前端传入）
 */
export interface CreateChatbotMessageInput {
  user_id: string
  session_id: string
  question: string
  answer: string
}

/**
 * 更新消息的输入
 */
export interface UpdateChatbotMessageInput {
  question?: string
  answer?: string
}

/**
 * 会话摘要（聚合视图，用于会话列表）
 */
export interface ChatbotSession {
  session_id: string
  user_id: string
  message_count: number
  last_message_at: number   // Unix 毫秒时间戳
  first_question: string
}
