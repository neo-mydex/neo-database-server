/**
 * @mydex/database
 * MyDex 数据库操作层统一导出入口
 */

// ========== 导出数据库连接 ==========
export { client, connect, disconnect } from './config/database.js'

// ========== 导出 Repository 单例 ==========
export { userRepo } from './repositories/user.repository.js'
export { contentRepo } from './repositories/content.repository.js'
export { chatRepo } from './repositories/chat.repository.js'

// ========== 导出类型定义 ==========
export * from './types/user.types.js'
export * from './types/content.types.js'
export * from './types/chat.types.js'

// ========== 导出 Repository 类（用于测试） ==========
export { UserRepository } from './repositories/user.repository.js'
export { ContentRepository } from './repositories/content.repository.js'
export { ChatRepository } from './repositories/chat.repository.js'

// ========== 导出验证工具 ==========
export { isValidChain, isValidTokenAddress } from './utils/validators.js'
export type { ChainCode } from './utils/validators.js'
