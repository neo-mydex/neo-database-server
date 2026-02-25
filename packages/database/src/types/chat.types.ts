/**
 * 聊天相关类型定义
 * 对应数据库表：ai_chat
 */

/**
 * AI 聊天记录
 */
export interface AiChat {
  id: number
  user_id: number  // 数据库中是 integer 类型
  session_id: string
  question: string
  answer: string
  created_at: Date
  updated_at: Date
}

/**
 * 创建聊天记录的输入类型
 */
export interface CreateChatInput {
  user_id: number  // 数据库中是 integer 类型
  session_id: string
  question: string
  answer: string
}

/**
 * 更新聊天记录的输入类型
 */
export interface UpdateChatInput {
  question?: string
  answer?: string
}

/**
 * 聊天会话摘要
 * 用于获取会话列表
 */
export interface ChatSession {
  session_id: string
  user_id: number  // 数据库中是 integer 类型
  message_count: number
  last_message_at: Date
  first_question: string
}
