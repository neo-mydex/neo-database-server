import { Router, type Request, type Response } from 'express'
import { contentRepo, userRepo } from '@mydex/database'
import { ApiError, asyncHandler } from '../middleware/error'
import { authMiddleware } from '../middleware/auth'

const router: Router = Router()

/**
 * GET /api/contents/raw/:id
 * 获取原始内容
 */
router.get(
  '/raw/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const content = await contentRepo.findRawById(id as string)

    if (!content) {
      throw new ApiError(404, '内容不存在')
    }

    res.json({
      success: true,
      data: content,
    })
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

    res.json({
      success: true,
      data: content,
    })
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

    res.json({
      success: true,
      data: contents,
      meta: {
        count: contents.length,
        page: pageNum,
        pageSize: pageSizeNum,
      },
    })
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

    res.json({
      success: true,
      data: contents,
      meta: {
        count: contents.length,
        page: pageNum,
        pageSize: pageSizeNum,
      },
    })
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

    res.json({
      success: true,
      data: contents,
      meta: {
        count: contents.length,
        page: pageNum,
        pageSize: pageSizeNum,
      },
    })
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

    res.json({
      success: true,
      data: contents,
      meta: {
        count: contents.length,
        page: pageNum,
        pageSize: pageSizeNum,
        userId: req.userId,
      },
    })
  })
)

export default router
