/**
 * 内容相关类型定义
 * 对应数据库表：ai_raw_content、ai_processed_content
 */

/**
 * 支持的区块链代号
 */
export type ChainCode =
  | 'eth'      // Ethereum
  | 'sol'      // Solana
  | 'bsc'      // BNB Smart Chain
  | 'polygon'  // Polygon
  | 'avax'     // Avalanche
  | 'base'     // Coinbase Base
  | 'op'       // Optimism
  | 'arb'      // Arbitrum
  | 'ftm'      // Fantom
  | 'movr'     // Moonriver
  | 'glm'      // Moonbeam
  | 'aurora'   // Aurora
  | 'metis'    // Metis
  | 'bnb'      // BNB Chain (旧)
  | 'cro'      // Cronos

/**
 * 社交媒体指标
 * 仅当 content_type = 'social' 时存在
 */
export interface SocialMetrics {
  likes: number
  retweets?: number
  shares?: number
  replies?: number
  views?: number
  author_followers?: number
  is_kol?: boolean
  verified?: boolean
}

/**
 * 建议代币信息
 * 用于可交易资讯，关联相关代币
 */
export interface SuggestedToken {
  symbol: string              // 代币符号，如 "ETH"
  name: string                // 代币名称，如 "Ethereum"
  relevance_score: number     // 相关度分数 0-1
  sentiment: 'bullish' | 'bearish' | 'neutral'
  confidence: number          // 置信度 0-1
  chain?: ChainCode | null    // 区块链代号，如 "eth", "sol", "arb" 等
  addr?: string | null        // 代币地址（EVM: 0x 开头，SOL: base58 编码）
}

/**
 * 建议问题/快捷操作
 * 用于"猜你想问"功能
 */
export interface SuggestedQuestion {
  label: string
  action: 'chat' | 'component'
  chat?: {
    message: string
  }
  component?: {
    type: 'assets_card' | 'trade_card' | 'settings_card' | 'profile_card' | 'history_card'
    params?: Record<string, any>
  }
}

/**
 * 原始内容类型
 * 对应数据库表：ai_raw_content
 */
export interface RawContent {
  id: string
  title: string
  content_type: 'news' | 'edu' | 'social'
  content: string
  source: string
  publishedAt: Date
  url?: string
  author?: string
  language?: string
  images?: string[]
  social_metrics?: SocialMetrics
}

/**
 * 处理后内容类型
 * 对应数据库表：ai_processed_content
 * 继承 RawContent 的所有字段，并新增 AI 处理结果字段
 */
export interface ProcessedContent extends RawContent {
  volatility: number          // 0-1, AI 评估的市场波动性
  summary: string             // AI 省流版，2-3 句话概括
  evidence_points: string[]   // 判断依据，1-4 个分点
  suggested_questions: SuggestedQuestion[]  // 猜你想问/快捷操作
  detected_language: 'zh-CN' | 'en-US' | 'other'  // AI 检测的语言
  category: 'educational' | 'tradable' | 'macro'  // 卡片分类
  risk_level: 'low' | 'medium' | 'high'  // 风险等级
  tags: string[]              // 标签列表
  suggested_tokens?: SuggestedToken[]  // 相关代币（可交易资讯）
  overall_sentiment?: 'bullish' | 'bearish' | 'neutral'  // 整体情感倾向
}

/**
 * 创建原始内容的输入类型
 */
export type CreateRawContentInput = Omit<RawContent, 'id'>

/**
 * 创建处理后内容的输入类型
 */
export type CreateProcessedContentInput = Omit<ProcessedContent, 'id'>

/**
 * 内容查询过滤器
 */
export interface ContentQueryFilter {
  content_type?: 'news' | 'edu' | 'social'
  category?: 'educational' | 'tradable' | 'macro'
  risk_level?: 'low' | 'medium' | 'high'
  source?: string
  language?: string
  limit?: number
  offset?: number
}

/**
 * 内容排序选项
 */
export type ContentSortOption = 'published_at_desc' | 'published_at_asc' | 'volatility_desc' | 'volatility_asc'
