import { Router, type Request, type Response } from 'express'
import { chatbotSessionRepo } from '@mydex/database'
import { ApiError, asyncHandler, successResponse } from '../middleware/error'
import { authMiddleware } from '../middleware/auth'

const router: Router = Router()

// ================================================================
// 会话接口（sessions）
// ================================================================

/**
 * GET /ai-api/chats/sessions
 * 获取当前登录用户的会话列表（JWT 鉴权）
 */
router.get(
  '/sessions',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const sessions = await chatbotSessionRepo.findSessionsByUserId(req.userId!)
    res.json(successResponse(sessions, { count: sessions.length }))
  })
)

/**
 * GET /ai-api/chats/sessions/by-user/:userId
 * 通过 userId 获取会话列表（无鉴权，供后台/测试用）
 */
router.get(
  '/sessions/by-user/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const sessions = await chatbotSessionRepo.findSessionsByUserId(userId)
    res.json(successResponse(sessions, { count: sessions.length }))
  })
)

/**
 * GET /ai-api/chats/sessions/:sessionId
 * 获取单个会话详情（JWT 鉴权，校验归属）
 */
router.get(
  '/sessions/:sessionId',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params

    const session = await chatbotSessionRepo.findSessionById(sessionId)
    if (!session) {
      throw new ApiError(404, 'Session not found')
    }
    if (session.user_id !== req.userId) {
      throw new ApiError(403, 'Access denied')
    }

    res.json(successResponse(session))
  })
)

/**
 * DELETE /ai-api/chats/sessions/:sessionId
 * 删除整个会话（JWT 鉴权，校验归属）
 */
router.delete(
  '/sessions/:sessionId',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params

    const session = await chatbotSessionRepo.findSessionById(sessionId)
    if (!session) {
      throw new ApiError(404, 'Session not found')
    }
    if (session.user_id !== req.userId) {
      throw new ApiError(403, 'Access denied')
    }

    await chatbotSessionRepo.deleteSession(sessionId)
    res.json(successResponse({ message: 'Session deleted successfully' }))
  })
)

/**
 * POST /ai-api/chats/sessions/:sessionId/stream
 * 流式 AI 对话（SSE，JWT 鉴权）
 * 当前返回 mock 数据，后续替换为真实 AI Agent
 */
router.post(
  '/sessions/:sessionId/stream',
  authMiddleware,
  async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const mockText = '我已经收到你的信息啦，稍等我一下再回复。'
    const chars = mockText.split('')

    res.write(`data: ${JSON.stringify({ type: 'session_start', data: {}, ts: Date.now() })}\n\n`)

    let i = 0
    const timer = setInterval(() => {
      if (i < chars.length) {
        res.write(`data: ${JSON.stringify({ type: 'llm_token', data: { content: chars[i] }, ts: Date.now() })}\n\n`)
        i++
      } else {
        res.write(`data: ${JSON.stringify({ type: 'session_end', data: {}, ts: Date.now() })}\n\n`)
        clearInterval(timer)
        res.end()
      }
    }, 50)

    req.on('close', () => clearInterval(timer))
  }
)

// ================================================================
// 消息接口（messages）
// ================================================================

/**
 * GET /ai-api/chats/messages?sessionId=xxx
 * 获取某会话的所有消息（JWT 鉴权，校验归属）
 */
router.get(
  '/messages',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.query

    if (!sessionId) {
      throw new ApiError(400, 'Missing required query param: sessionId')
    }

    const belongs = await chatbotSessionRepo.sessionBelongsToUser(sessionId as string, req.userId!)
    if (!belongs) {
      // 会话不存在或不属于当前用户，统一返回 404 避免信息泄露
      throw new ApiError(404, 'Session not found')
    }

    const messages = await chatbotSessionRepo.findMessagesBySessionId(sessionId as string)
    res.json(successResponse(messages, { count: messages.length }))
  })
)

/**
 * POST /ai-api/chats/messages
 * 保存一条消息（JWT 鉴权，user_id 从 token 取，不接受前端传入）
 */
router.post(
  '/messages',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { session_id, question, answer } = req.body

    if (!session_id || !question || !answer) {
      throw new ApiError(400, 'Missing required fields', {
        required: ['session_id', 'question', 'answer'],
      })
    }

    const message = await chatbotSessionRepo.createMessage({
      user_id: req.userId!,
      session_id,
      question,
      answer,
    })

    res.status(201).json(successResponse(message))
  })
)

/**
 * PATCH /ai-api/chats/messages/:id
 * 更新某条消息（JWT 鉴权，校验归属）
 */
router.patch(
  '/messages/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)
    const { question, answer } = req.body

    const belongs = await chatbotSessionRepo.messageBelongsToUser(id, req.userId!)
    if (!belongs) {
      throw new ApiError(404, 'Message not found')
    }

    const message = await chatbotSessionRepo.updateMessage(id, { question, answer })
    res.json(successResponse(message))
  })
)

/**
 * DELETE /ai-api/chats/messages/:id
 * 删除单条消息（JWT 鉴权，校验归属）
 */
router.delete(
  '/messages/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id)

    const belongs = await chatbotSessionRepo.messageBelongsToUser(id, req.userId!)
    if (!belongs) {
      throw new ApiError(404, 'Message not found')
    }

    await chatbotSessionRepo.deleteMessage(id)
    res.json(successResponse({ message: 'Message deleted successfully' }))
  })
)

export default router
