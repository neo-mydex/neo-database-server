/**
 * AI 聊天机器人会话仓库
 * 负责处理 ai_chatbot_sessions 表的所有数据操作
 * user_id 统一使用 Privy ID（VARCHAR），与 ai_user_profiles 保持一致
 */

import { client } from '../config/database.js'
import type {
  ChatbotMessage,
  ChatbotSession,
  CreateChatbotMessageInput,
  UpdateChatbotMessageInput,
} from '../types/chatbot-session.types.js'

export class ChatbotSessionRepository {
  private mapMessage(row: any): ChatbotMessage {
    return {
      ...row,
      created_at: new Date(row.created_at).getTime(),
      updated_at: new Date(row.updated_at).getTime(),
    }
  }

  private mapSession(row: any): ChatbotSession {
    return {
      ...row,
      message_count: parseInt(row.message_count, 10),
      last_message_at: new Date(row.last_message_at).getTime(),
    }
  }

  // ── CREATE ──────────────────────────────────────────────────────

  async createMessage(input: CreateChatbotMessageInput): Promise<ChatbotMessage> {
    const now = new Date()
    const result = await client.query(
      `INSERT INTO ai_chatbot_sessions
         (user_id, session_id, question, answer, question_verbose, answer_verbose, tools, client_actions, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        input.user_id,
        input.session_id,
        input.question,
        input.answer,
        input.question_verbose ?? null,
        input.answer_verbose ? JSON.stringify(input.answer_verbose) : null,
        input.tools ?? null,
        input.client_actions ?? null,
        now,
        now,
      ]
    )
    return this.mapMessage(result.rows[0])
  }

  // ── READ ─────────────────────────────────────────────────────────

  async findMessageById(id: number): Promise<ChatbotMessage | null> {
    const result = await client.query(
      `SELECT * FROM ai_chatbot_sessions WHERE id = $1`,
      [id]
    )
    return result.rows[0] ? this.mapMessage(result.rows[0]) : null
  }

  /** 获取某会话下所有消息（按时间升序） */
  async findMessagesBySessionId(sessionId: string): Promise<ChatbotMessage[]> {
    const result = await client.query(
      `SELECT * FROM ai_chatbot_sessions WHERE session_id = $1 ORDER BY created_at ASC`,
      [sessionId]
    )
    return result.rows.map((r: any) => this.mapMessage(r))
  }

  /** 获取某用户的所有会话摘要列表（按最后消息时间倒序） */
  async findSessionsByUserId(userId: string): Promise<ChatbotSession[]> {
    const result = await client.query(
      `SELECT
         session_id,
         user_id,
         COUNT(*)                                                            AS message_count,
         MAX(created_at)                                                     AS last_message_at,
         (SELECT question FROM ai_chatbot_sessions
          WHERE user_id = $1 AND session_id = s.session_id
          ORDER BY created_at ASC LIMIT 1)                                  AS first_question
       FROM ai_chatbot_sessions s
       WHERE user_id = $1
       GROUP BY session_id, user_id
       ORDER BY last_message_at DESC`,
      [userId]
    )
    return result.rows.map((r: any) => this.mapSession(r))
  }

  /** 获取单个会话摘要 */
  async findSessionById(sessionId: string): Promise<ChatbotSession | null> {
    const result = await client.query(
      `SELECT
         session_id,
         user_id,
         COUNT(*)         AS message_count,
         MAX(created_at)  AS last_message_at,
         (SELECT question FROM ai_chatbot_sessions
          WHERE session_id = $1 ORDER BY created_at ASC LIMIT 1) AS first_question
       FROM ai_chatbot_sessions
       WHERE session_id = $1
       GROUP BY session_id, user_id`,
      [sessionId]
    )
    return result.rows[0] ? this.mapSession(result.rows[0]) : null
  }

  /** 校验会话是否属于指定用户 */
  async sessionBelongsToUser(sessionId: string, userId: string): Promise<boolean> {
    const result = await client.query(
      `SELECT 1 FROM ai_chatbot_sessions WHERE session_id = $1 AND user_id = $2 LIMIT 1`,
      [sessionId, userId]
    )
    return (result.rowCount ?? 0) > 0
  }

  /** 校验消息是否属于指定用户 */
  async messageBelongsToUser(id: number, userId: string): Promise<boolean> {
    const result = await client.query(
      `SELECT 1 FROM ai_chatbot_sessions WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [id, userId]
    )
    return (result.rowCount ?? 0) > 0
  }

  // ── UPDATE ────────────────────────────────────────────────────────

  async updateMessage(id: number, input: UpdateChatbotMessageInput): Promise<ChatbotMessage | null> {
    const updates: string[] = []
    const values: any[] = []
    let idx = 1

    if (input.question          !== undefined) { updates.push(`question = $${idx++}`);          values.push(input.question) }
    if (input.answer            !== undefined) { updates.push(`answer = $${idx++}`);            values.push(input.answer) }
    if (input.question_verbose  !== undefined) { updates.push(`question_verbose = $${idx++}`); values.push(input.question_verbose) }
    if (input.answer_verbose    !== undefined) { updates.push(`answer_verbose = $${idx++}`);   values.push(input.answer_verbose ? JSON.stringify(input.answer_verbose) : null) }
    if (input.tools             !== undefined) { updates.push(`tools = $${idx++}`);             values.push(input.tools) }
    if (input.client_actions    !== undefined) { updates.push(`client_actions = $${idx++}`);   values.push(input.client_actions) }

    if (updates.length === 0) return this.findMessageById(id)

    updates.push(`updated_at = $${idx++}`)
    values.push(new Date())
    values.push(id)

    const result = await client.query(
      `UPDATE ai_chatbot_sessions SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )
    return result.rows[0] ? this.mapMessage(result.rows[0]) : null
  }

  // ── DELETE ────────────────────────────────────────────────────────

  async deleteMessage(id: number): Promise<void> {
    await client.query(`DELETE FROM ai_chatbot_sessions WHERE id = $1`, [id])
  }

  async deleteSession(sessionId: string): Promise<void> {
    await client.query(`DELETE FROM ai_chatbot_sessions WHERE session_id = $1`, [sessionId])
  }
}

export const chatbotSessionRepo = new ChatbotSessionRepository()
