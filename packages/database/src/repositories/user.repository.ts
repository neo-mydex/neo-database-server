/**
 * 用户数据仓库
 * 负责处理 ai_user_profiles 表的所有数据操作
 */

import { client } from '../config/database.js'
import type {
  UserProfile,
  CreateUserInput,
  UpdateUserTraitsInput,
  UpdateUserCatInput,
} from '../types/user.types.js'

/**
 * UserRepository 类
 * 实现用户相关的 CRUD 操作
 */
export class UserRepository {
  /**
   * CREATE - 创建新用户
   * @param userId 用户 ID
   * @param input 用户创建输入数据
   * @returns 创建的用户档案
   */
  async create(userId: string, input: CreateUserInput): Promise<UserProfile> {
    const now = new Date()
    const result = await client.query<UserProfile>(
      `INSERT INTO ai_user_profiles
        (user_id, risk_appetite, patience, info_sensitivity, decision_speed, cat_type, cat_desc, registered_at, trade_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        input.risk_appetite,
        input.patience,
        input.info_sensitivity,
        input.decision_speed,
        input.cat_type,
        input.cat_desc,
        now,
        0, // trade_count 初始值为 0
      ]
    )
    return result.rows[0]
  }

  /**
   * READ - 根据 user_id 查询用户
   * @param userId 用户 ID
   * @returns 用户档案，不存在则返回 null
   */
  async findById(userId: string): Promise<UserProfile | null> {
    const result = await client.query<UserProfile>(
      `SELECT * FROM ai_user_profiles WHERE user_id = $1`,
      [userId]
    )
    return result.rows[0] || null
  }

  /**
   * READ - 获取所有用户（分页）
   * @param limit 每页数量
   * @param offset 偏移量
   * @returns 用户列表
   */
  async findAll(limit: number = 100, offset: number = 0): Promise<UserProfile[]> {
    const result = await client.query<UserProfile>(
      `SELECT * FROM ai_user_profiles ORDER BY registered_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    )
    return result.rows
  }

  /**
   * UPDATE - 更新用户维度值
   * @param userId 用户 ID
   * @param input 要更新的维度值
   */
  async updateTraits(userId: string, input: UpdateUserTraitsInput): Promise<void> {
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (input.risk_appetite !== undefined) {
      updates.push(`risk_appetite = $${paramIndex++}`)
      values.push(input.risk_appetite)
    }
    if (input.patience !== undefined) {
      updates.push(`patience = $${paramIndex++}`)
      values.push(input.patience)
    }
    if (input.info_sensitivity !== undefined) {
      updates.push(`info_sensitivity = $${paramIndex++}`)
      values.push(input.info_sensitivity)
    }
    if (input.decision_speed !== undefined) {
      updates.push(`decision_speed = $${paramIndex++}`)
      values.push(input.decision_speed)
    }

    if (updates.length === 0) {
      return // 没有需要更新的字段
    }

    values.push(userId)
    await client.query(
      `UPDATE ai_user_profiles SET ${updates.join(', ')} WHERE user_id = $${paramIndex}`,
      values
    )
  }

  /**
   * UPDATE - 更新用户分类
   * @param userId 用户 ID
   * @param input 用户分类数据
   */
  async updateCat(userId: string, input: UpdateUserCatInput): Promise<void> {
    await client.query(
      `UPDATE ai_user_profiles SET cat_type = $1, cat_desc = $2 WHERE user_id = $3`,
      [input.cat_type, input.cat_desc, userId]
    )
  }

  /**
   * UPDATE - 交易次数 +1
   * @param userId 用户 ID
   */
  async incrementTradeCount(userId: string): Promise<void> {
    await client.query(
      `UPDATE ai_user_profiles SET trade_count = trade_count + 1 WHERE user_id = $1`,
      [userId]
    )
  }

  /**
   * UPDATE - AI 对话次数 +1
   * @param userId 用户 ID
   */
  async incrementChatCount(userId: string): Promise<void> {
    await client.query(
      `UPDATE ai_user_profiles SET chat_count = chat_count + 1 WHERE user_id = $1`,
      [userId]
    )
  }

  /**
   * UPDATE - AI 分析次数 +1
   * @param userId 用户 ID
   */
  async incrementAnalyseCount(userId: string): Promise<void> {
    await client.query(
      `UPDATE ai_user_profiles SET analyse_count = analyse_count + 1 WHERE user_id = $1`,
      [userId]
    )
  }

  /**
   * UPDATE - 幂等打卡：同一天多次调用只算一次
   * @param userId 用户 ID
   * @returns 是否已经打过卡
   */
  async checkin(userId: string): Promise<{ already_checked_in: boolean }> {
    const result = await client.query(
      `UPDATE ai_user_profiles
       SET companion_days = companion_days + 1, last_active_date = CURRENT_DATE
       WHERE user_id = $1 AND (last_active_date IS NULL OR last_active_date < CURRENT_DATE)`,
      [userId]
    )
    return { already_checked_in: (result.rowCount ?? 0) === 0 }
  }

  /**
   * DELETE - 删除用户
   * @param userId 用户 ID
   */
  async delete(userId: string): Promise<void> {
    await client.query(
      `DELETE FROM ai_user_profiles WHERE user_id = $1`,
      [userId]
    )
  }

  /**
   * EXISTS - 检查用户是否存在
   * @param userId 用户 ID
   * @returns 是否存在
   */
  async exists(userId: string): Promise<boolean> {
    const result = await client.query(
      `SELECT 1 FROM ai_user_profiles WHERE user_id = $1 LIMIT 1`,
      [userId]
    )
    return (result.rowCount ?? 0) > 0
  }

  /**
   * COUNT - 统计用户总数
   * @returns 用户总数
   */
  async count(): Promise<number> {
    const result = await client.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ai_user_profiles`
    )
    return parseInt(result.rows[0].count, 10)
  }
}

/**
 * UserRepository 单例
 * 导出此实例供外部使用
 */
export const userRepo = new UserRepository()
