/**
 * 聊天数据仓库
 * 负责处理 ai_chat 表的所有数据操作
 */

import { client } from '../config/database.js'
import type {
  AiChat,
  CreateChatInput,
  UpdateChatInput,
  ChatSession,
} from '../types/chat.types.js'

/**
 * ChatRepository 类
 * 实现聊天相关的 CRUD 操作
 */
export class ChatRepository {
  private mapChat(row: any): AiChat {
    return {
      ...row,
      created_at: new Date(row.created_at).getTime(),
      updated_at: new Date(row.updated_at).getTime(),
    }
  }

  private mapSession(row: any): ChatSession {
    return {
      ...row,
      last_message_at: new Date(row.last_message_at).getTime(),
    }
  }

  /**
   * CREATE - 创建聊天记录
   * @param input 聊天记录创建输入
   * @returns 创建的聊天记录
   */
  async create(input: CreateChatInput): Promise<AiChat> {
    const now = new Date()
    const result = await client.query(
      `INSERT INTO ai_chat (user_id, session_id, question, answer, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [input.user_id, input.session_id, input.question, input.answer, now, now]
    )
    return this.mapChat(result.rows[0])
  }

  /**
   * READ - 根据 ID 查询聊天记录
   * @param id 聊天记录 ID
   * @returns 聊天记录，不存在则返回 null
   */
  async findById(id: number): Promise<AiChat | null> {
    const result = await client.query(
      `SELECT * FROM ai_chat WHERE id = $1`,
      [id]
    )
    return result.rows[0] ? this.mapChat(result.rows[0]) : null
  }

  /**
   * READ - 根据用户 ID 查询所有聊天记录
   * @param userId 用户 ID (数字)
   * @returns 聊天记录列表（按创建时间升序）
   */
  async findByUserId(userId: number): Promise<AiChat[]> {
    const result = await client.query(
      `SELECT * FROM ai_chat WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    )
    return result.rows.map((row: any) => this.mapChat(row))
  }

  /**
   * READ - 根据会话 ID 查询所有聊天记录
   * @param sessionId 会话 ID
   * @returns 聊天记录列表（按创建时间升序）
   */
  async findBySessionId(sessionId: string): Promise<AiChat[]> {
    const result = await client.query(
      `SELECT * FROM ai_chat WHERE session_id = $1 ORDER BY created_at ASC`,
      [sessionId]
    )
    return result.rows.map((row: any) => this.mapChat(row))
  }

  /**
   * READ - 获取用户的所有会话列表
   * @param userId 用户 ID (数字)
   * @returns 会话摘要列表
   */
  async findSessionsByUserId(userId: number): Promise<ChatSession[]> {
    const result = await client.query(
      `SELECT
        session_id,
        user_id,
        COUNT(*) as message_count,
        MAX(created_at) as last_message_at,
        (SELECT question FROM ai_chat WHERE user_id = $1 AND session_id = s.session_id ORDER BY created_at ASC LIMIT 1) as first_question
       FROM ai_chat s
       WHERE user_id = $1
       GROUP BY session_id, user_id
       ORDER BY last_message_at DESC`,
      [userId]
    )
    return result.rows.map((row: any) => this.mapSession(row))
  }

  /**
   * READ - 根据会话 ID 获取单个会话摘要
   * @param sessionId 会话 ID
   * @returns 会话摘要，不存在则返回 null
   */
  async findSessionById(sessionId: string): Promise<ChatSession | null> {
    const result = await client.query(
      `SELECT
        session_id,
        user_id,
        COUNT(*) as message_count,
        MAX(created_at) as last_message_at,
        (SELECT question FROM ai_chat WHERE session_id = $1 ORDER BY created_at ASC LIMIT 1) as first_question
       FROM ai_chat
       WHERE session_id = $1
       GROUP BY session_id, user_id`,
      [sessionId]
    )
    return result.rows[0] ? this.mapSession(result.rows[0]) : null
  }

  /**
   * READ - 获取最近的聊天记录
   * @param limit 数量限制
   * @param offset 偏移量
   * @returns 聊天记录列表
   */
  async findRecent(limit: number = 100, offset: number = 0): Promise<AiChat[]> {
    const result = await client.query(
      `SELECT * FROM ai_chat ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    )
    return result.rows.map((row: any) => this.mapChat(row))
  }

  /**
   * UPDATE - 更新聊天记录
   * @param id 聊天记录 ID
   * @param input 更新输入数据
   * @returns 更新后的聊天记录
   */
  async update(id: number, input: UpdateChatInput): Promise<AiChat | null> {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (input.question !== undefined) {
      updates.push(`question = $${paramIndex++}`)
      values.push(input.question)
    }
    if (input.answer !== undefined) {
      updates.push(`answer = $${paramIndex++}`)
      values.push(input.answer)
    }

    if (updates.length === 0) {
      return this.findById(id)
    }

    updates.push(`updated_at = $${paramIndex++}`)
    values.push(new Date())
    values.push(id)

    const result = await client.query(
      `UPDATE ai_chat SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )
    return result.rows[0] ? this.mapChat(result.rows[0]) : null
  }

  /**
   * DELETE - 删除聊天记录
   * @param id 聊天记录 ID
   */
  async delete(id: number): Promise<void> {
    await client.query(
      `DELETE FROM ai_chat WHERE id = $1`,
      [id]
    )
  }

  /**
   * DELETE - 删除会话的所有聊天记录
   * @param sessionId 会话 ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    await client.query(
      `DELETE FROM ai_chat WHERE session_id = $1`,
      [sessionId]
    )
  }

  /**
   * DELETE - 删除用户的所有聊天记录
   * @param userId 用户 ID (数字)
   */
  async deleteByUserId(userId: number): Promise<void> {
    await client.query(
      `DELETE FROM ai_chat WHERE user_id = $1`,
      [userId]
    )
  }

  /**
   * COUNT - 统计用户的聊天记录总数
   * @param userId 用户 ID (数字)
   * @returns 聊天记录总数
   */
  async countByUserId(userId: number): Promise<number> {
    const result = await client.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ai_chat WHERE user_id = $1`,
      [userId]
    )
    return parseInt(result.rows[0].count, 10)
  }

  /**
   * COUNT - 统计会话的聊天记录总数
   * @param sessionId 会话 ID
   * @returns 聊天记录总数
   */
  async countBySessionId(sessionId: string): Promise<number> {
    const result = await client.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ai_chat WHERE session_id = $1`,
      [sessionId]
    )
    return parseInt(result.rows[0].count, 10)
  }

  /**
   * EXISTS - 检查会话是否存在
   * @param sessionId 会话 ID
   * @returns 是否存在
   */
  async sessionExists(sessionId: string): Promise<boolean> {
    const result = await client.query(
      `SELECT 1 FROM ai_chat WHERE session_id = $1 LIMIT 1`,
      [sessionId]
    )
    return (result.rowCount ?? 0) > 0
  }
}

/**
 * ChatRepository 单例
 * 导出此实例供外部使用
 */
export const chatRepo = new ChatRepository()
