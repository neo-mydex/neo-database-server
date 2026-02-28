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
  SupportedLang,
  ContentTranslation,
  CreateTranslationInput,
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
   * @param lang 语言（默认 zh-CN，返回原文）
   * @returns 处理后内容，不存在则返回 null
   */
  async findProcessedById(id: string, lang: SupportedLang = 'zh-CN'): Promise<ProcessedContent | null> {
    const result = await client.query(
      `SELECT * FROM ai_processed_content WHERE id = $1`,
      [id]
    )
    if (!result.rowCount || result.rowCount === 0) return null
    const content = this.mapProcessedContent(result.rows[0])
    if (lang === 'zh-CN') return content
    const translation = await this.findTranslation(id, lang)
    return this.applyTranslation(content, translation)
  }

  /**
   * READ - 查询处理后内容列表
   * @param filter 查询过滤器（含可选 lang 字段）
   * @param sort 排序选项
   * @returns 处理后内容列表
   */
  async findProcessed(filter: ContentQueryFilter = {}, sort: ContentSortOption = 'published_at_desc'): Promise<ProcessedContent[]> {
    const lang = filter.lang ?? 'zh-CN'
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

    const contents = result.rows.map(row => this.mapProcessedContent(row))
    if (lang === 'zh-CN' || contents.length === 0) return contents

    // 批量查翻译，避免 N+1
    const ids = contents.map(c => c.id)
    const translationResult = await client.query(
      `SELECT * FROM ai_processed_content_translations
       WHERE content_id = ANY($1) AND lang = $2`,
      [ids, lang]
    )
    const translationMap = new Map<string, ContentTranslation>(
      translationResult.rows.map(t => [t.content_id, this.mapTranslation(t)])
    )
    return contents.map(c => this.applyTranslation(c, translationMap.get(c.id) ?? null))
  }

  /**
   * READ - 按分类查询处理后内容
   * @param category 分类（educational、tradable、macro）
   * @param limit 数量限制
   * @param offset 偏移量
   * @param lang 语言（默认 zh-CN）
   * @returns 处理后内容列表
   */
  async getProcessedByCategory(
    category: 'educational' | 'tradable' | 'macro',
    limit: number = 100,
    offset: number = 0,
    lang: SupportedLang = 'zh-CN'
  ): Promise<ProcessedContent[]> {
    return this.findProcessed({ category, limit, offset, lang })
  }

  /**
   * READ - 按风险等级查询处理后内容
   * @param riskLevel 风险等级（low、medium、high）
   * @param limit 数量限制
   * @param offset 偏移量
   * @param lang 语言（默认 zh-CN）
   * @returns 处理后内容列表
   */
  async getProcessedByRiskLevel(
    riskLevel: 'low' | 'medium' | 'high',
    limit: number = 100,
    offset: number = 0,
    lang: SupportedLang = 'zh-CN'
  ): Promise<ProcessedContent[]> {
    return this.findProcessed({ risk_level: riskLevel, limit, offset, lang })
  }

  // ========== 翻译操作 ==========

  /**
   * UPSERT - 写入或更新翻译
   * @param input 翻译内容
   */
  async upsertTranslation(input: CreateTranslationInput): Promise<void> {
    await client.query(
      `INSERT INTO ai_processed_content_translations
         (content_id, lang, title, summary, content, evidence_points, tags, suggested_questions, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (content_id, lang) DO UPDATE SET
         title = EXCLUDED.title,
         summary = EXCLUDED.summary,
         content = EXCLUDED.content,
         evidence_points = EXCLUDED.evidence_points,
         tags = EXCLUDED.tags,
         suggested_questions = EXCLUDED.suggested_questions,
         updated_at = NOW()`,
      [
        input.content_id,
        input.lang,
        input.title,
        input.summary,
        input.content ?? null,
        JSON.stringify(input.evidence_points),
        JSON.stringify(input.tags),
        JSON.stringify(input.suggested_questions),
      ]
    )
  }

  /**
   * READ - 查询单条翻译
   * @param contentId 内容 ID
   * @param lang 语言
   * @returns 翻译内容，不存在则返回 null
   */
  async findTranslation(contentId: string, lang: SupportedLang): Promise<ContentTranslation | null> {
    const result = await client.query(
      `SELECT * FROM ai_processed_content_translations
       WHERE content_id = $1 AND lang = $2`,
      [contentId, lang]
    )
    return result.rowCount && result.rowCount > 0 ? this.mapTranslation(result.rows[0]) : null
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
   * 将翻译内容覆盖到 ProcessedContent 上
   * 无翻译时 fallback 返回原文
   */
  private applyTranslation(content: ProcessedContent, translation: ContentTranslation | null): ProcessedContent {
    if (!translation) return content
    return {
      ...content,
      title: translation.title,
      summary: translation.summary,
      content: translation.content ?? content.content,
      evidence_points: translation.evidence_points,
      tags: translation.tags,
      suggested_questions: translation.suggested_questions,
    }
  }

  /**
   * 映射数据库行到 ContentTranslation 对象
   */
  private mapTranslation(row: any): ContentTranslation {
    return {
      content_id: row.content_id,
      lang: row.lang,
      title: row.title,
      summary: row.summary,
      content: row.content ?? undefined,
      evidence_points: row.evidence_points || [],
      tags: row.tags || [],
      suggested_questions: row.suggested_questions || [],
    }
  }

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
    return {
      id: row.id,
      title: row.title,
      content_type: row.content_type,
      content: row.content,
      source: row.source,
      publishedAt: new Date(row.published_at).getTime(),
      url: row.url,
      author: row.author,
      language: row.language,
      images: row.images ?? null,
      social_metrics: row.social_metrics ?? null,
    }
  }

  /**
   * 映射数据库行到 ProcessedContent 对象
   * @param row 数据库行
   * @returns ProcessedContent 对象
   */
  private mapProcessedContent(row: any): ProcessedContent {
    const base = this.mapRawContent(row)

    return {
      ...base,
      volatility: row.volatility,
      summary: row.summary,
      evidence_points: row.evidence_points || [],
      suggested_questions: row.suggested_questions || [],
      detected_language: row.detected_language,
      category: row.category,
      risk_level: row.risk_level,
      tags: row.tags || [],
      suggested_tokens: row.suggested_tokens ?? null,
      overall_sentiment: row.overall_sentiment,
    }
  }
}

/**
 * ContentRepository 单例
 * 导出此实例供外部使用
 */
export const contentRepo = new ContentRepository()
