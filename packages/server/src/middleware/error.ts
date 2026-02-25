import { Request, Response, NextFunction } from 'express'

/**
 * 自定义错误类
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 统一错误处理中间件
 */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('❌ API Error:', err)

  // 如果是自定义 API 错误
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        details: err.details,
      },
    })
  }

  // 处理其他错误
  return res.status(500).json({
    success: false,
    error: {
      message: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
  })
}

/**
 * 404 处理中间件
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      message: '接口不存在',
      path: req.path,
    },
  })
}

/**
 * 异步路由包装器，自动捕获错误
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
