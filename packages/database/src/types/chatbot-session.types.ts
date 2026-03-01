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
  question_verbose: Record<string, any>   // 结构化问题，含 context（必填，不为 null）
  answer_verbose: any[]                   // 完整 SSE 事件数组，供前端回放（必填，无 tool 时为 []）
  tools: string[]                         // 触发的 tool 名列表（无调用时为 []）
  client_actions: string[]                // 触发的 client action type 列表（无 action 时为 []）
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
  question_verbose?: Record<string, any>
  answer_verbose?: any[]
  tools?: string[]
  client_actions?: string[]
}

/**
 * 更新消息的输入
 */
export interface UpdateChatbotMessageInput {
  question?: string
  answer?: string
  question_verbose?: Record<string, any>
  answer_verbose?: any[]
  tools?: string[]
  client_actions?: string[]
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
