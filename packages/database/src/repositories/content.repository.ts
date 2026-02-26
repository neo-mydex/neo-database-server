/**
 * 内容数据仓库
 * 负责处理 ai_raw_content 和 ai_processed_content 表的所有数据操作
 */

import { client } from '../config/database.js'
import { isValidChain, isValidTokenAddress } from '../utils/validators.js'
import type {
  RawContent,
  ProcessedContent,
  CreateRawContentInput,
  CreateProcessedContentInput,
  ContentQueryFilter,
  ContentSortOption,
} from '../types/content.types.js'

/**
 * ContentRepository 类
 * 实现内容相关的 CRUD 操作
 */
export class ContentRepository {
  // ========== RawContent 操作 ==========

  /**
   * CREATE - 创建原始内容
   * @param input 原始内容创建输入
   * @returns 创建的原始内容
   */
  async createRaw(input: CreateRawContentInput): Promise<RawContent> {
    const id = this.generateId()
    const result = await client.query<RawContent>(
      `INSERT INTO ai_raw_content
        (id, title, content_type, content, source, published_at, url, author, language, images, social_metrics)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        id,
        input.title,
        input.content_type,
        input.content,
        input.source,
        input.publishedAt,
        input.url ?? null,
        input.author ?? null,
        input.language ?? null,
        input.images ? JSON.stringify(input.images) : null,
        input.social_metrics ? JSON.stringify(input.social_metrics) : null,
      ]
    )
    return this.mapRawContent(result.rows[0])
  }

  /**
   * READ - 根据 ID 查询原始内容
   * @param id 内容 ID
   * @returns 原始内容，不存在则返回 null
   */
  async findRawById(id: string): Promise<RawContent | null> {
    const result = await client.query(
      `SELECT * FROM ai_raw_content WHERE id = $1`,
      [id]
    )
    return result.rowCount && result.rowCount > 0 ? this.mapRawContent(result.rows[0]) : null
  }

  /**
   * READ - 查询原始内容列表
   * @param filter 查询过滤器
   * @param sort 排序选项
   * @returns 原始内容列表
   */
  async findRaw(filter: ContentQueryFilter = {}, sort: ContentSortOption = 'published_at_desc'): Promise<RawContent[]> {
    const { conditions, params } = this.buildFilterQuery(filter)
    const orderBy = this.buildSortQuery(sort)

    const query = `
      SELECT * FROM ai_raw_content
      ${conditions ? 'WHERE ' + conditions : ''}
      ${orderBy}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    const result = await client.query(query, [
      ...params,
      filter.limit || 100,
      filter.offset || 0,
    ])

    return result.rows.map(row => this.mapRawContent(row))
  }

  /**
   * CREATE BATCH - 批量创建原始内容（事务）
   * @param inputs 原始内容创建输入数组
   * @returns 创建的原始内容数组
   */
  async createRawBatch(inputs: CreateRawContentInput[]): Promise<RawContent[]> {
    await client.query('BEGIN')
    try {
      const results: RawContent[] = []
      for (const input of inputs) {
        results.push(await this.createRaw(input))
      }
      await client.query('COMMIT')
      return results
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    }
  }

  /**
   * DELETE - 删除原始内容
   * @param id 内容 ID
   */
  async deleteRaw(id: string): Promise<void> {
    await client.query(
      `DELETE FROM ai_raw_content WHERE id = $1`,
      [id]
    )
  }

  // ========== ProcessedContent 操作 ==========

  /**
   * CREATE - 创建处理后内容
   * @param input 处理后内容创建输入
   * @returns 创建的处理后内容
   */
  async createProcessed(input: CreateProcessedContentInput): Promise<ProcessedContent> {
    // 验证 suggested_tokens 中的 chain 和 addr 字段
    if (input.suggested_tokens) {
      for (const token of input.suggested_tokens) {
        if (token.chain && !isValidChain(token.chain)) {
          console.warn(`[ContentRepository] Invalid chain code: ${token.chain} for token ${token.symbol}`)
        }
        if (token.addr && !isValidTokenAddress(token.addr, token.chain)) {
          console.warn(`[ContentRepository] Invalid address: ${token.addr} for token ${token.symbol} on chain ${token.chain || 'unknown'}`)
        }
      }
    }

    const id = this.generateId()
    const result = await client.query(
      `INSERT INTO ai_processed_content
        (id, title, content_type, content, source, published_at, url, author, language, images, social_metrics,
         volatility, summary, evidence_points, suggested_questions, detected_language, category, risk_level, tags, suggested_tokens, overall_sentiment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING *`,
      [
        id,
        input.title,
        input.content_type,
        input.content,
        input.source,
        input.publishedAt,
        input.url ?? null,
        input.author ?? null,
        input.language ?? null,
        input.images ? JSON.stringify(input.images) : null,
        input.social_metrics ? JSON.stringify(input.social_metrics) : null,
        input.volatility,
        input.summary,
        JSON.stringify(input.evidence_points),
        JSON.stringify(input.suggested_questions),
        input.detected_language,
        input.category,
        input.risk_level,
        JSON.stringify(input.tags),
        input.suggested_tokens ? JSON.stringify(input.suggested_tokens) : null,
        input.overall_sentiment ?? null,
      ]
    )
    return this.mapProcessedContent(result.rows[0])
  }

  /**
   * READ - 根据 ID 查询处理后内容
   * @param id 内容 ID
   * @returns 处理后内容，不存在则返回 null
   */
  async findProcessedById(id: string): Promise<ProcessedContent | null> {
    const result = await client.query(
      `SELECT * FROM ai_processed_content WHERE id = $1`,
      [id]
    )
    return result.rowCount && result.rowCount > 0 ? this.mapProcessedContent(result.rows[0]) : null
  }

  /**
   * READ - 查询处理后内容列表
   * @param filter 查询过滤器
   * @param sort 排序选项
   * @returns 处理后内容列表
   */
  async findProcessed(filter: ContentQueryFilter = {}, sort: ContentSortOption = 'published_at_desc'): Promise<ProcessedContent[]> {
    const { conditions, params } = this.buildFilterQuery(filter)
    const orderBy = this.buildSortQuery(sort)

    const query = `
      SELECT * FROM ai_processed_content
      ${conditions ? 'WHERE ' + conditions : ''}
      ${orderBy}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    const result = await client.query(query, [
      ...params,
      filter.limit || 100,
      filter.offset || 0,
    ])

    return result.rows.map(row => this.mapProcessedContent(row))
  }

  /**
   * READ - 按分类查询处理后内容
   * @param category 分类（educational、tradable、macro）
   * @param limit 数量限制
   * @param offset 偏移量
   * @returns 处理后内容列表
   */
  async getProcessedByCategory(
    category: 'educational' | 'tradable' | 'macro',
    limit: number = 100,
    offset: number = 0
  ): Promise<ProcessedContent[]> {
    return this.findProcessed({ category, limit, offset })
  }

  /**
   * READ - 按风险等级查询处理后内容
   * @param riskLevel 风险等级（low、medium、high）
   * @param limit 数量限制
   * @param offset 偏移量
   * @returns 处理后内容列表
   */
  async getProcessedByRiskLevel(
    riskLevel: 'low' | 'medium' | 'high',
    limit: number = 100,
    offset: number = 0
  ): Promise<ProcessedContent[]> {
    return this.findProcessed({ risk_level: riskLevel, limit, offset })
  }

  /**
   * CREATE BATCH - 批量创建处理后内容（事务）
   * @param inputs 处理后内容创建输入数组
   * @returns 创建的处理后内容数组
   */
  async createProcessedBatch(inputs: CreateProcessedContentInput[]): Promise<ProcessedContent[]> {
    await client.query('BEGIN')
    try {
      const results: ProcessedContent[] = []
      for (const input of inputs) {
        results.push(await this.createProcessed(input))
      }
      await client.query('COMMIT')
      return results
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    }
  }

  /**
   * DELETE - 删除处理后内容
   * @param id 内容 ID
   */
  async deleteProcessed(id: string): Promise<void> {
    await client.query(
      `DELETE FROM ai_processed_content WHERE id = $1`,
      [id]
    )
  }

  // ========== 辅助方法 ==========

  /**
   * 生成内容 ID
   * @returns 唯一 ID
   */
  private generateId(): string {
    return `content_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * 构建过滤查询
   * @param filter 过滤器
   * @returns SQL 条件和参数
   */
  private buildFilterQuery(filter: ContentQueryFilter): { conditions: string; params: any[] } {
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (filter.content_type) {
      conditions.push(`content_type = $${paramIndex++}`)
      params.push(filter.content_type)
    }
    if (filter.category) {
      conditions.push(`category = $${paramIndex++}`)
      params.push(filter.category)
    }
    if (filter.risk_level) {
      conditions.push(`risk_level = $${paramIndex++}`)
      params.push(filter.risk_level)
    }
    if (filter.source) {
      conditions.push(`source = $${paramIndex++}`)
      params.push(filter.source)
    }
    if (filter.language) {
      conditions.push(`language = $${paramIndex++}`)
      params.push(filter.language)
    }

    return {
      conditions: conditions.join(' AND '),
      params,
    }
  }

  /**
   * 构建排序查询
   * @param sort 排序选项
   * @returns SQL ORDER BY 子句
   */
  private buildSortQuery(sort: ContentSortOption): string {
    const sortMap: Record<ContentSortOption, string> = {
      published_at_desc: 'ORDER BY published_at DESC',
      published_at_asc: 'ORDER BY published_at ASC',
      volatility_desc: 'ORDER BY volatility DESC',
      volatility_asc: 'ORDER BY volatility ASC',
    }
    return sortMap[sort] || sortMap.published_at_desc
  }

  /**
   * 映射数据库行到 RawContent 对象
   * @param row 数据库行
   * @returns RawContent 对象
   */
  private mapRawContent(row: any): RawContent {
    // 安全的 JSON 解析函数
    const safeParse = (value: any): any => {
      if (!value) return undefined
      try {
        return JSON.parse(value)
      } catch {
        return undefined
      }
    }

    return {
      id: row.id,
      title: row.title,
      content_type: row.content_type,
      content: row.content,
      source: row.source,
      publishedAt: row.published_at,
      url: row.url,
      author: row.author,
      language: row.language,
      images: safeParse(row.images),
      social_metrics: safeParse(row.social_metrics),
    }
  }

  /**
   * 映射数据库行到 ProcessedContent 对象
   * @param row 数据库行
   * @returns ProcessedContent 对象
   */
  private mapProcessedContent(row: any): ProcessedContent {
    const base = this.mapRawContent(row)

    // 安全的 JSON 解析函数
    const safeParse = (value: any): any => {
      if (!value) return undefined
      try {
        return JSON.parse(value)
      } catch {
        return undefined
      }
    }

    return {
      ...base,
      volatility: row.volatility,
      summary: row.summary,
      evidence_points: safeParse(row.evidence_points) || [],
      suggested_questions: safeParse(row.suggested_questions) || [],
      detected_language: row.detected_language,
      category: row.category,
      risk_level: row.risk_level,
      tags: safeParse(row.tags) || [],
      suggested_tokens: safeParse(row.suggested_tokens),
      overall_sentiment: row.overall_sentiment,
    }
  }
}

/**
 * ContentRepository 单例
 * 导出此实例供外部使用
 */
export const contentRepo = new ContentRepository()
