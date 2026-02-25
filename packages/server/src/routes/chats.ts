import { Router, type Request, type Response } from 'express'
import { chatRepo } from '@mydex/database'
import { ApiError, asyncHandler } from '../middleware/error'

const router: Router = Router()

/**
 * GET /api/chats/:id
 * 获取单条聊天记录
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const chat = await chatRepo.findById(parseInt(id as string))

    if (!chat) {
      throw new ApiError(404, '聊天记录不存在')
    }

    res.json({
      success: true,
      data: chat,
    })
  })
)

/**
 * GET /api/chats/user/:userId
 * 获取用户的所有聊天记录
 */
router.get(
  '/user/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const chats = await chatRepo.findByUserId(parseInt(userId as string))

    res.json({
      success: true,
      data: chats,
      meta: {
        count: chats.length,
      },
    })
  })
)

/**
 * GET /api/chats/session/:sessionId
 * 获取会话的所有聊天记录
 */
router.get(
  '/session/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params
    const chats = await chatRepo.findBySessionId(sessionId as string)

    res.json({
      success: true,
      data: chats,
      meta: {
        count: chats.length,
      },
    })
  })
)

/**
 * GET /api/chats/user/:userId/sessions
 * 获取用户的所有会话列表
 */
router.get(
  '/user/:userId/sessions',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const sessions = await chatRepo.findSessionsByUserId(parseInt(userId as string))

    res.json({
      success: true,
      data: sessions,
      meta: {
        count: sessions.length,
      },
    })
  })
)

/**
 * POST /api/chats
 * 创建聊天记录
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { user_id, session_id, question, answer } = req.body

    // 验证必填字段
    if (!user_id || !session_id || !question || !answer) {
      throw new ApiError(400, '缺少必填字段', {
        required: ['user_id', 'session_id', 'question', 'answer'],
      })
    }

    const chat = await chatRepo.create({
      user_id: parseInt(user_id),
      session_id,
      question,
      answer,
    })

    res.status(201).json({
      success: true,
      data: chat,
    })
  })
)

/**
 * PATCH /api/chats/:id
 * 更新聊天记录
 */
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { question, answer } = req.body

    const chat = await chatRepo.update(parseInt(id as string), { question, answer })

    if (!chat) {
      throw new ApiError(404, '聊天记录不存在')
    }

    res.json({
      success: true,
      data: chat,
    })
  })
)

/**
 * DELETE /api/chats/:id
 * 删除单条聊天记录
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    await chatRepo.delete(parseInt(id as string))

    res.json({
      success: true,
      data: { message: '删除成功' },
    })
  })
)

/**
 * DELETE /api/chats/session/:sessionId
 * 删除整个会话
 */
router.delete(
  '/session/:sessionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params
    await chatRepo.deleteSession(sessionId as string)

    res.json({
      success: true,
      data: { message: '会话已删除' },
    })
  })
)

export default router
