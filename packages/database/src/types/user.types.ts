/**
 * 用户档案类型定义
 * 对应数据库表：ai_user_profiles
 */

/**
 * 用户完整档案信息
 */
export interface UserProfile {
  user_id: string
  risk_appetite: number      // 1-10, 风险偏好
  patience: number           // 1-10, 耐心程度
  info_sensitivity: number   // 1-10, 信息敏感度
  decision_speed: number     // 1-10, 决策速度
  cat_type: string           // 用户分类标签（如：激进猎人喵、稳健理财喵等）
  cat_desc: string           // 用户分类描述
  registered_at: number      // 注册时间（Unix 毫秒时间戳）
  trade_count: number        // 交易次数
  chat_count: number         // AI 对话次数
  analyse_count: number      // AI 分析次数
  companion_days: number     // 陪伴天数（打卡累计）
  last_active_date: number | null  // 最后打卡日期（Unix 毫秒时间戳）
}

/**
 * 创建用户时的输入类型
 * 排除所有自动字段
 */
export type CreateUserInput = Omit<
  UserProfile,
  'registered_at' | 'trade_count' | 'chat_count' | 'analyse_count' | 'companion_days' | 'last_active_date'
>

/**
 * 更新用户维度时的输入类型
 * 只允许更新四个维度值
 */
export type UpdateUserTraitsInput = Partial<Pick<UserProfile, 'risk_appetite' | 'patience' | 'info_sensitivity' | 'decision_speed'>>

/**
 * 更新用户分类时的输入类型
 */
export interface UpdateUserCatInput {
  cat_type: string
  cat_desc: string
}
