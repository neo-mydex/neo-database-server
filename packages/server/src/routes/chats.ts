import { Router, type Request, type Response } from 'express'
import { chatbotSessionRepo } from '@mydex/database'
import { ApiError, asyncHandler, successResponse } from '../middleware/error'
import { authMiddleware } from '../middleware/auth'

const router: Router = Router()

// ================================================================
// SSE 工具函数
// ================================================================

function sendEvent(res: Response, event: object): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`)
}

async function streamTokens(
  res: Response,
  text: string,
  delayMs: number,
  aborted: () => boolean
): Promise<void> {
  const tokens = text.match(/[\u4e00-\u9fa5]{1,3}|[^\u4e00-\u9fa5\s]+|\s+/g) ?? []
  for (const token of tokens) {
    if (aborted()) return
    sendEvent(res, { type: 'llm_token', data: { content: token }, ts: Date.now() })
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
}

function genCallId(): string {
  return `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function detectScene(message: string): 'swap' | 'deposit' | 'text' {
  const lower = message.toLowerCase()
  if (lower.includes('swap') || lower.includes('兑换') || lower.includes('交换')) return 'swap'
  if (lower.includes('deposit') || lower.includes('充值') || lower.includes('入金')) return 'deposit'
  return 'text'
}

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
    const userId = req.params.userId as string
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
    const sessionId = req.params.sessionId as string

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
    const sessionId = req.params.sessionId as string

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
 * 支持 tool_call 事件和 client_action：
 *   - 含 swap/兑换/交换 → 三段式：文字 → OPEN_TRADE_WINDOW → 文字
 *   - 含 deposit/充值/入金 → 三段式：文字 → SHOW_DEPOSIT_PROMPT → 文字
 *   - 其他 → 纯文字流
 */
router.post(
  '/sessions/:sessionId/stream',
  authMiddleware,
  async (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const { message = '', context = {} } = req.body
    let isAborted = false
    req.on('close', () => { isAborted = true })

    const scene = detectScene(message)
    const callId = genCallId()

    sendEvent(res, { type: 'session_start', data: { model: 'mock' }, ts: Date.now() })

    if (scene === 'swap') {
      await streamTokens(res, '好的，我来帮你创建兑换请求，稍等一下。', 40, () => isAborted)
      if (isAborted) return
      sendEvent(res, {
        type: 'tool_call_start',
        data: {
          tool: 'create_trade_intent',
          callId,
          args: {
            symbol: 'ETH',
            side: 'BUY',
            tradeType: 'SPOT',
            network: context.network ?? 'eth',
            amountUsd: '100',
          },
        },
        ts: Date.now(),
      })
      await sleep(400)
      if (isAborted) return
      sendEvent(res, {
        type: 'tool_call_complete',
        data: {
          tool: 'create_trade_intent',
          callId,
          duration: 400,
          result: {
            status: 'success',
            data: {
              message: '已准备好买入 ETH 的交易',
              client_action: {
                type: 'OPEN_TRADE_WINDOW',
                params: {
                  symbol: 'ETH',
                  side: 'BUY',
                  tradeType: 'SPOT',
                  network: context.network ?? 'eth',
                  amountUsd: '100',
                },
              },
            },
          },
        },
        ts: Date.now(),
      })
      await streamTokens(res, '交易窗口已为你打开，请确认参数后提交。', 40, () => isAborted)

    } else if (scene === 'deposit') {
      await streamTokens(res, '检测到余额可能不足，为你显示充值引导。', 40, () => isAborted)
      if (isAborted) return
      sendEvent(res, {
        type: 'tool_call_start',
        data: {
          tool: 'show_deposit_prompt',
          callId,
          args: {
            token: 'USDC',
            network: context.network ?? 'eth',
          },
        },
        ts: Date.now(),
      })
      await sleep(400)
      if (isAborted) return
      sendEvent(res, {
        type: 'tool_call_complete',
        data: {
          tool: 'show_deposit_prompt',
          callId,
          duration: 400,
          result: {
            status: 'success',
            data: {
              message: '请先充值 USDC',
              client_action: {
                type: 'SHOW_DEPOSIT_PROMPT',
                params: {
                  token: 'USDC',
                  network: context.network ?? 'eth',
                  address: '0x6da2ddd35367c323a5cb45ea0ecdb8d243445db4',
                  redirectUrl: 'https://buy.onramper.com',
                },
              },
            },
          },
        },
        ts: Date.now(),
      })
      await streamTokens(res, '充值完成后即可继续操作。', 40, () => isAborted)

    } else {
      await streamTokens(res, '我已经收到你的信息啦，请问还有什么可以帮你？', 40, () => isAborted)
    }

    if (!isAborted) {
      sendEvent(res, { type: 'session_end', data: {}, ts: Date.now() })
      res.end()
    }
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
    const { session_id, question, answer, question_verbose, answer_verbose, tools, client_actions } = req.body

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
      question_verbose,
      answer_verbose,
      tools,
      client_actions,
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
    const id = parseInt(req.params.id as string)
    const { question, answer, question_verbose, answer_verbose, tools, client_actions } = req.body

    const belongs = await chatbotSessionRepo.messageBelongsToUser(id, req.userId!)
    if (!belongs) {
      throw new ApiError(404, 'Message not found')
    }

    const message = await chatbotSessionRepo.updateMessage(id, {
      question,
      answer,
      question_verbose,
      answer_verbose,
      tools,
      client_actions,
    })
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
    const id = parseInt(req.params.id as string)

    const belongs = await chatbotSessionRepo.messageBelongsToUser(id, req.userId!)
    if (!belongs) {
      throw new ApiError(404, 'Message not found')
    }

    await chatbotSessionRepo.deleteMessage(id)
    res.json(successResponse({ message: 'Message deleted successfully' }))
  })
)

export default router
