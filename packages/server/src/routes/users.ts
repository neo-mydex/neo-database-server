import { Router, type Request, type Response } from 'express'
import { userRepo } from '@mydex/database'
import { ApiError, asyncHandler, successResponse } from '../middleware/error'
import { authMiddleware } from '../middleware/auth'

const router: Router = Router()

/**
 * GET /ai-api/users/
 * 获取当前用户信息（JWT 认证）
 * 注意：必须在 /:userId 之前注册，防止被匹配为 userId
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userRepo.findById(req.userId!)

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    res.json(successResponse(user))
  })
)

/**
 * POST /ai-api/users/
 * 创建用户（JWT 认证，user_id 从 token 取）
 */
router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { risk_appetite, patience, info_sensitivity, decision_speed } = req.body
    const userId = req.userId!

    // 验证数值范围（仅当前端传了值时才校验）
    const numericFields = [risk_appetite, patience, info_sensitivity, decision_speed].filter((v) => v !== undefined)
    if (numericFields.some((v) => v < 1 || v > 10)) {
      throw new ApiError(400, 'Trait values must be between 1 and 10')
    }

    const { user, created } = await userRepo.upsert(userId, {
      risk_appetite,
      patience,
      info_sensitivity,
      decision_speed,
    })

    res.status(created ? 201 : 200).json(successResponse(user))
  })
)


/**
 * PATCH /ai-api/users/trade-count
 * 交易次数 +1（JWT 认证）
 */
router.patch(
  '/trade-count',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!

    const exists = await userRepo.exists(userId)
    if (!exists) {
      throw new ApiError(404, 'User not found')
    }

    await userRepo.incrementTradeCount(userId)

    res.json(successResponse({ message: 'Trade count updated' }))
  })
)

/**
 * PATCH /ai-api/users/chat-count
 * AI 对话次数 +1（JWT 认证）
 */
router.patch(
  '/chat-count',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!

    const exists = await userRepo.exists(userId)
    if (!exists) {
      throw new ApiError(404, 'User not found')
    }

    await userRepo.incrementChatCount(userId)

    res.json(successResponse({ message: 'Chat count updated' }))
  })
)

/**
 * PATCH /ai-api/users/analyse-count
 * AI 分析次数 +1（JWT 认证）
 */
router.patch(
  '/analyse-count',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!

    const exists = await userRepo.exists(userId)
    if (!exists) {
      throw new ApiError(404, 'User not found')
    }

    await userRepo.incrementAnalyseCount(userId)

    res.json(successResponse({ message: 'Analyse count updated' }))
  })
)

/**
 * POST /ai-api/users/checkin
 * 打卡（幂等，同一天多次只算一次）（JWT 认证）
 */
router.post(
  '/checkin',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!

    const exists = await userRepo.exists(userId)
    if (!exists) {
      throw new ApiError(404, 'User not found')
    }

    const result = await userRepo.checkin(userId)
    const user = await userRepo.findById(userId)

    res.json(successResponse({
      companion_days: user!.companion_days,
      already_checked_in: result.already_checked_in,
    }))
  })
)

/**
 * DELETE /ai-api/users/
 * 删除当前用户（JWT 认证）
 */
router.delete(
  '/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!

    const exists = await userRepo.exists(userId)
    if (!exists) {
      throw new ApiError(404, 'User not found')
    }

    await userRepo.delete(userId)

    res.json(successResponse({ message: 'Deleted successfully' }))
  })
)

/**
 * GET /ai-api/users/:userId
 * 获取用户信息（无鉴权，仅供测试）
 * 注意：必须在所有静态路径之后注册
 */
router.get(
  '/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId as string
    const user = await userRepo.findById(userId)

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    res.json(successResponse(user))
  })
)

export default router
