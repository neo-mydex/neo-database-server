import { Router, type Request, type Response } from 'express'
import { contentRepo, userRepo } from '@mydex/database'
import { ApiError, asyncHandler, successResponse } from '../middleware/error'
import { authMiddleware } from '../middleware/auth'

const router: Router = Router()

/**
 * GET /raw
 * 批量获取原始内容列表（支持过滤和排序）
 * 查询参数：
 * - content_type: news | edu | social
 * - source: 来源
 * - language: 语言
 * - sort: published_at_desc | published_at_asc
 * - page: 页码（从1开始，默认1）
 * - pageSize: 每页数量（默认20，最大100）
 */
router.get(
  '/raw',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      content_type,
      source,
      language,
      sort = 'published_at_desc',
      page = '1',
      pageSize = '20',
    } = req.query

    const pageNum = parseInt(page as string)
    const pageSizeNum = Math.min(parseInt(pageSize as string), 100)

    if (pageNum < 1 || pageSizeNum < 1) {
      throw new ApiError(400, 'page 和 pageSize 必须大于0')
    }

    const offset = (pageNum - 1) * pageSizeNum

    const contents = await contentRepo.findRaw({
      content_type: content_type as any,
      source: source as string,
      language: language as string,
      limit: pageSizeNum,
      offset,
    }, sort as any)

    res.json(successResponse(contents, { count: contents.length, page: pageNum, pageSize: pageSizeNum }))
  })
)

/**
 * POST /raw
 * 创建原始内容
 */
router.post(
  '/raw',
  asyncHandler(async (req: Request, res: Response) => {
    const { title, content_type, content, source, publishedAt, url, author, language, images, social_metrics } = req.body

    if (!title || !content_type || !content || !source || !publishedAt) {
      throw new ApiError(400, '缺少必填字段', {
        required: ['title', 'content_type', 'content', 'source', 'publishedAt'],
      })
    }

    const validContentTypes = ['news', 'edu', 'social']
    if (!validContentTypes.includes(content_type)) {
      throw new ApiError(400, '无效的 content_type', { valid: validContentTypes })
    }

    const created = await contentRepo.createRaw({
      title,
      content_type,
      content,
      source,
      publishedAt: new Date(publishedAt),
      url,
      author,
      language,
      images,
      social_metrics,
    })

    res.status(201).json(successResponse(created))
  })
)

/**
 * POST /raw/batch
 * 批量创建原始内容
 */
router.post(
  '/raw/batch',
  asyncHandler(async (req: Request, res: Response) => {
    const inputs = req.body

    if (!Array.isArray(inputs) || inputs.length === 0) {
      throw new ApiError(400, 'body 必须是非空数组')
    }

    const validContentTypes = ['news', 'edu', 'social']
    for (const item of inputs) {
      if (!item.title || !item.content_type || !item.content || !item.source || !item.publishedAt) {
        throw new ApiError(400, '每条记录缺少必填字段', {
          required: ['title', 'content_type', 'content', 'source', 'publishedAt'],
        })
      }
      if (!validContentTypes.includes(item.content_type)) {
        throw new ApiError(400, '无效的 content_type', { valid: validContentTypes })
      }
    }

    const created = await contentRepo.createRawBatch(
      inputs.map(item => ({
        title: item.title,
        content_type: item.content_type,
        content: item.content,
        source: item.source,
        publishedAt: new Date(item.publishedAt),
        url: item.url,
        author: item.author,
        language: item.language,
        images: item.images,
        social_metrics: item.social_metrics,
      }))
    )

    res.status(201).json(successResponse(created, { count: created.length }))
  })
)

/**
 * DELETE /raw/:id
 * 删除原始内容
 */
router.delete(
  '/raw/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params

    const existing = await contentRepo.findRawById(id)
    if (!existing) {
      throw new ApiError(404, '内容不存在')
    }

    await contentRepo.deleteRaw(id)
    res.json(successResponse({ message: 'Deleted successfully' }))
  })
)

/**
 * GET /raw/:id
 * 获取单条原始内容
 */
router.get(
  '/raw/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const content = await contentRepo.findRawById(id as string)

    if (!content) {
      throw new ApiError(404, '内容不存在')
    }

    res.json(successResponse(content))
  })
)

/**
 * POST /processed/batch
 * 批量创建处理后内容
 */
router.post(
  '/processed/batch',
  asyncHandler(async (req: Request, res: Response) => {
    const inputs = req.body

    if (!Array.isArray(inputs) || inputs.length === 0) {
      throw new ApiError(400, 'body 必须是非空数组')
    }

    const validContentTypes = ['news', 'edu', 'social']
    const validCategories = ['educational', 'tradable', 'macro']
    const validRiskLevels = ['low', 'medium', 'high']

    for (const item of inputs) {
      if (
        !item.title || !item.content_type || !item.content || !item.source || !item.publishedAt ||
        !item.summary || !item.category || !item.risk_level ||
        item.volatility === undefined || !item.detected_language ||
        !Array.isArray(item.evidence_points) || !Array.isArray(item.suggested_questions) || !Array.isArray(item.tags)
      ) {
        throw new ApiError(400, '每条记录缺少必填字段', {
          required: [
            'title', 'content_type', 'content', 'source', 'publishedAt',
            'volatility', 'summary', 'evidence_points', 'suggested_questions',
            'detected_language', 'category', 'risk_level', 'tags',
          ],
        })
      }
      if (!validContentTypes.includes(item.content_type)) {
        throw new ApiError(400, '无效的 content_type', { valid: validContentTypes })
      }
      if (!validCategories.includes(item.category)) {
        throw new ApiError(400, '无效的 category', { valid: validCategories })
      }
      if (!validRiskLevels.includes(item.risk_level)) {
        throw new ApiError(400, '无效的 risk_level', { valid: validRiskLevels })
      }
    }

    const created = await contentRepo.createProcessedBatch(
      inputs.map(item => ({
        title: item.title,
        content_type: item.content_type,
        content: item.content,
        source: item.source,
        publishedAt: new Date(item.publishedAt),
        url: item.url,
        author: item.author,
        language: item.language,
        images: item.images,
        social_metrics: item.social_metrics,
        volatility: item.volatility,
        summary: item.summary,
        evidence_points: item.evidence_points,
        suggested_questions: item.suggested_questions,
        detected_language: item.detected_language,
        category: item.category,
        risk_level: item.risk_level,
        tags: item.tags,
        suggested_tokens: item.suggested_tokens,
        overall_sentiment: item.overall_sentiment,
      }))
    )

    res.status(201).json(successResponse(created, { count: created.length }))
  })
)

/**
 * GET /api/contents/processed/:id
 * 获取处理后内容
 */
router.get(
  '/processed/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const content = await contentRepo.findProcessedById(id as string)

    if (!content) {
      throw new ApiError(404, '内容不存在')
    }

    res.json(successResponse(content))
  })
)

/**
 * GET /api/contents/processed
 * 获取处理后内容列表（支持过滤和排序）
 * 查询参数：
 * - category: educational | tradable | macro
 * - risk_level: low | medium | high
 * - content_type: news | edu | social
 * - source: 来源
 * - language: 语言
 * - sort: published_at_desc | published_at_asc | volatility_desc | volatility_asc
 * - page: 页码（从1开始，默认1）
 * - pageSize: 每页数量（默认20，最大100）
 */
router.get(
  '/processed',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      category,
      risk_level,
      content_type,
      source,
      language,
      sort = 'published_at_desc',
      page = '1',
      pageSize = '20',
    } = req.query

    // 参数验证
    const pageNum = parseInt(page as string)
    const pageSizeNum = Math.min(parseInt(pageSize as string), 100)

    if (pageNum < 1 || pageSizeNum < 1) {
      throw new ApiError(400, 'page 和 pageSize 必须大于0')
    }

    const offset = (pageNum - 1) * pageSizeNum

    const contents = await contentRepo.findProcessed({
      category: category as any,
      risk_level: risk_level as any,
      content_type: content_type as any,
      source: source as string,
      language: language as string,
      limit: pageSizeNum,
      offset,
    }, sort as any)

    res.json(successResponse(contents, { count: contents.length, page: pageNum, pageSize: pageSizeNum }))
  })
)

/**
 * GET /api/contents/category/:category
 * 按分类获取内容
 * 查询参数：
 * - page: 页码（从1开始，默认1）
 * - pageSize: 每页数量（默认20，最大100）
 */
router.get(
  '/category/:category',
  asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.params
    const { page = '1', pageSize = '20' } = req.query

    // 验证分类参数
    const validCategories = ['educational', 'tradable', 'macro']
    if (!validCategories.includes(category as string)) {
      throw new ApiError(400, '无效的分类参数', { valid: validCategories })
    }

    // 参数验证和转换
    const pageNum = parseInt(page as string)
    const pageSizeNum = Math.min(parseInt(pageSize as string), 100)

    if (pageNum < 1 || pageSizeNum < 1) {
      throw new ApiError(400, 'page 和 pageSize 必须大于0')
    }

    const offset = (pageNum - 1) * pageSizeNum

    const contents = await contentRepo.getProcessedByCategory(
      category as any,
      pageSizeNum,
      offset
    )

    res.json(successResponse(contents, { count: contents.length, page: pageNum, pageSize: pageSizeNum }))
  })
)

/**
 * GET /api/contents/risk/:riskLevel
 * 按风险等级获取内容
 * 查询参数：
 * - page: 页码（从1开始，默认1）
 * - pageSize: 每页数量（默认20，最大100）
 */
router.get(
  '/risk/:riskLevel',
  asyncHandler(async (req: Request, res: Response) => {
    const { riskLevel } = req.params
    const { page = '1', pageSize = '20' } = req.query

    // 验证风险等级参数
    const validRiskLevels = ['low', 'medium', 'high']
    if (!validRiskLevels.includes(riskLevel as string)) {
      throw new ApiError(400, '无效的风险等级参数', { valid: validRiskLevels })
    }

    // 参数验证和转换
    const pageNum = parseInt(page as string)
    const pageSizeNum = Math.min(parseInt(pageSize as string), 100)

    if (pageNum < 1 || pageSizeNum < 1) {
      throw new ApiError(400, 'page 和 pageSize 必须大于0')
    }

    const offset = (pageNum - 1) * pageSizeNum

    const contents = await contentRepo.getProcessedByRiskLevel(
      riskLevel as any,
      pageSizeNum,
      offset
    )

    res.json(successResponse(contents, { count: contents.length, page: pageNum, pageSize: pageSizeNum }))
  })
)

/**
 * GET /api/contents/recommended
 * 需要 Privy JWT 认证，推荐给当前登录用户的内容列表
 * 查询参数与 /api/contents/processed 相同
 */
router.get(
  '/recommended',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      category,
      risk_level,
      content_type,
      source,
      language,
      sort = 'published_at_desc',
      page = '1',
      pageSize = '20',
    } = req.query

    const pageNum = parseInt(page as string)
    const pageSizeNum = Math.min(parseInt(pageSize as string), 100)

    if (pageNum < 1 || pageSizeNum < 1) {
      throw new ApiError(400, 'page 和 pageSize 必须大于0')
    }

    const offset = (pageNum - 1) * pageSizeNum

    // 查询用户画像
    const userProfile = await userRepo.findById(req.userId!)
    console.log(`[recommended] userId: ${req.userId}, profile:`, userProfile)
    // TODO: 根据 userProfile 实现个性化推荐逻辑
    // 例如：userProfile.risk_appetite 高 → 优先 risk_level: high
    //       userProfile.decision_speed 快 → 优先 category: tradable

    const contents = await contentRepo.findProcessed({
      category: category as any,
      risk_level: risk_level as any,
      content_type: content_type as any,
      source: source as string,
      language: language as string,
      limit: pageSizeNum,
      offset,
    }, sort as any)

    res.json(successResponse(contents, { count: contents.length, page: pageNum, pageSize: pageSizeNum, userId: req.userId }))
  })
)

export default router
