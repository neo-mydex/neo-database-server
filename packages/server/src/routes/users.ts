import { Router, type Request, type Response } from 'express'
import { userRepo } from '@mydex/database'
import { ApiError, asyncHandler, successResponse } from '../middleware/error'

const router: Router = Router()

/**
 * GET /api/users/:userId
 * 获取用户信息
 */
router.get(
  '/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const user = await userRepo.findById(userId as string)

    if (!user) {
      throw new ApiError(404, '用户不存在')
    }

    res.json(successResponse(user))
  })
)

/**
 * POST /api/users
 * 创建用户
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { user_id, risk_appetite, patience, info_sensitivity, decision_speed, cat_type, cat_desc } = req.body

    // 验证必填字段
    if (!user_id || !risk_appetite || !patience || !info_sensitivity || !decision_speed || !cat_type || !cat_desc) {
      throw new ApiError(400, '缺少必填字段', {
        required: ['user_id', 'risk_appetite', 'patience', 'info_sensitivity', 'decision_speed', 'cat_type', 'cat_desc'],
      })
    }

    // 验证数值范围
    if ([risk_appetite, patience, info_sensitivity, decision_speed].some((v) => v < 1 || v > 10)) {
      throw new ApiError(400, '维度值必须在 1-10 之间')
    }

    // 检查用户是否已存在
    const existing = await userRepo.exists(user_id)
    if (existing) {
      throw new ApiError(409, '用户已存在')
    }

    const user = await userRepo.create(user_id, {
      user_id,
      risk_appetite,
      patience,
      info_sensitivity,
      decision_speed,
      cat_type,
      cat_desc,
    })

    res.status(201).json(successResponse(user))
  })
)

/**
 * PATCH /api/users/:userId/traits
 * 更新用户维度
 */
router.patch(
  '/:userId/traits',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const { risk_appetite, patience, info_sensitivity, decision_speed } = req.body

    // 验证数值范围
    const values = [risk_appetite, patience, info_sensitivity, decision_speed].filter((v) => v !== undefined)
    if (values.some((v) => v < 1 || v > 10)) {
      throw new ApiError(400, '维度值必须在 1-10 之间')
    }

    // 检查用户是否存在
    const exists = await userRepo.exists(userId as string)
    if (!exists) {
      throw new ApiError(404, '用户不存在')
    }

    await userRepo.updateTraits(userId as string, {
      risk_appetite,
      patience,
      info_sensitivity,
      decision_speed,
    })

    res.json(successResponse({ message: '更新成功' }))
  })
)

/**
 * PATCH /api/users/:userId/trade-count
 * 交易次数 +1
 */
router.patch(
  '/:userId/trade-count',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params

    // 检查用户是否存在
    const exists = await userRepo.exists(userId as string)
    if (!exists) {
      throw new ApiError(404, '用户不存在')
    }

    await userRepo.incrementTradeCount(userId as string)

    res.json(successResponse({ message: '交易次数已更新' }))
  })
)

/**
 * DELETE /api/users/:userId
 * 删除用户
 */
router.delete(
  '/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params

    // 检查用户是否存在
    const exists = await userRepo.exists(userId as string)
    if (!exists) {
      throw new ApiError(404, '用户不存在')
    }

    await userRepo.delete(userId as string)

    res.json(successResponse({ message: '删除成功' }))
  })
)

export default router
