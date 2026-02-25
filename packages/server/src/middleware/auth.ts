import { Request, Response, NextFunction } from 'express'
import { verifyPrivyToken } from '../utils/privy'

// 扩展 Express Request 类型，携带验证后的 userId
declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

/**
 * Privy JWT 验证中间件
 * 从 Authorization: Bearer <token> 提取并验证 token
 * 验证成功后将 userId 挂到 req.userId
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { message: '未提供认证 Token' },
    })
  }

  const token = authHeader.slice(7)
  const userId = await verifyPrivyToken(token)

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { message: 'Token 无效或已过期' },
    })
  }

  req.userId = userId
  next()
}
