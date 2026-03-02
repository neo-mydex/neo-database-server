/**
 * 用户数据仓库
 * 负责处理 ai_user_profiles 表的所有数据操作
 */

import { client } from '../config/database.js'
import type {
  UserProfile,
  CreateUserInput,
  UpdateUserCatInput,
  UpsertUserInput,
} from '../types/user.types.js'

/**
 * UserRepository 类
 * 实现用户相关的 CRUD 操作
 */
export class UserRepository {
  /** 分数 → 等级：1-3→1, 4-7→2, 8-10→3 */
  private scoreToLevel(score: number): 1 | 2 | 3 {
    const r = Math.round(score)
    if (r <= 3) return 1
    if (r <= 7) return 2
    return 3
  }

  /** 查 ai_cat_map，找不到时兜底均衡的全能喵 */
  private async lookupCat(
    risk: number, speed: number, info: number, patience: number
  ): Promise<{ cat_type: string; cat_desc: string }> {
    const res = await client.query(
      `SELECT cat_type, cat_desc FROM ai_cat_map
       WHERE risk_level=$1 AND speed_level=$2 AND info_level=$3 AND patience_level=$4 LIMIT 1`,
      [this.scoreToLevel(risk), this.scoreToLevel(speed), this.scoreToLevel(info), this.scoreToLevel(patience)]
    )
    return res.rows[0] ?? { cat_type: '均衡的全能喵', cat_desc: '哪都行，哪都不突出' }
  }

  private mapUser(row: any): UserProfile {
    return {
      ...row,
      registered_at: new Date(row.registered_at).getTime(),
      last_active_date: row.last_active_date ? new Date(row.last_active_date).getTime() : null,
    }
  }

  /**
   * CREATE - 创建新用户
   * @param userId 用户 ID
   * @param input 用户创建输入数据
   * @returns 创建的用户档案
   */
  async create(userId: string, input: CreateUserInput): Promise<UserProfile> {
    const now = new Date()
    const result = await client.query(
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
    return this.mapUser(result.rows[0])
  }

  /**
   * UPSERT - 创建或更新用户
   * 用户不存在时创建（用传入值或默认值），已存在时更新传入的字段
   * cat_type/cat_desc 由服务端根据四维分数自动查 ai_cat_map 表填充，前端无需传入
   * @param userId 用户 ID
   * @param input 可选的维度字段（不含 cat_type/cat_desc）
   * @returns 用户档案 + 是否新创建
   */
  async upsert(userId: string, input: UpsertUserInput): Promise<{ user: UserProfile; created: boolean }> {
    const existing = await this.findById(userId)

    if (!existing) {
      const risk = input.risk_appetite ?? 5
      const speed = input.decision_speed ?? 5
      const info = input.info_sensitivity ?? 5
      const patience = input.patience ?? 5
      const cat = await this.lookupCat(risk, speed, info, patience)
      const user = await this.create(userId, {
        user_id: userId,
        risk_appetite: risk,
        patience,
        info_sensitivity: info,
        decision_speed: speed,
        cat_type: cat.cat_type,
        cat_desc: cat.cat_desc,
      })
      return { user, created: true }
    }

    // 已存在：只更新传入的字段，若有任意维度传入则同步重算 cat
    const updates: string[] = []
    const values: any[] = []
    let i = 1

    if (input.risk_appetite !== undefined) { updates.push(`risk_appetite = $${i++}`); values.push(input.risk_appetite) }
    if (input.patience !== undefined) { updates.push(`patience = $${i++}`); values.push(input.patience) }
    if (input.info_sensitivity !== undefined) { updates.push(`info_sensitivity = $${i++}`); values.push(input.info_sensitivity) }
    if (input.decision_speed !== undefined) { updates.push(`decision_speed = $${i++}`); values.push(input.decision_speed) }

    const hasDimension = input.risk_appetite !== undefined
      || input.patience !== undefined
      || input.info_sensitivity !== undefined
      || input.decision_speed !== undefined

    if (hasDimension) {
      const risk = input.risk_appetite ?? existing.risk_appetite
      const speed = input.decision_speed ?? existing.decision_speed
      const info = input.info_sensitivity ?? existing.info_sensitivity
      const patience = input.patience ?? existing.patience
      const cat = await this.lookupCat(risk, speed, info, patience)
      updates.push(`cat_type = $${i++}`); values.push(cat.cat_type)
      updates.push(`cat_desc = $${i++}`); values.push(cat.cat_desc)
    }

    if (updates.length > 0) {
      values.push(userId)
      await client.query(
        `UPDATE ai_user_profiles SET ${updates.join(', ')} WHERE user_id = $${i}`,
        values
      )
    }

    const user = await this.findById(userId)
    return { user: user!, created: false }
  }

  /**
   * READ - 根据 user_id 查询用户
   * @param userId 用户 ID
   * @returns 用户档案，不存在则返回 null
   */
  async findById(userId: string): Promise<UserProfile | null> {
    const result = await client.query(
      `SELECT * FROM ai_user_profiles WHERE user_id = $1`,
      [userId]
    )
    return result.rows[0] ? this.mapUser(result.rows[0]) : null
  }

  /**
   * READ - 获取所有用户（分页）
   * @param limit 每页数量
   * @param offset 偏移量
   * @returns 用户列表
   */
  async findAll(limit: number = 100, offset: number = 0): Promise<UserProfile[]> {
    const result = await client.query(
      `SELECT * FROM ai_user_profiles ORDER BY registered_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    )
    return result.rows.map((row: any) => this.mapUser(row))
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
