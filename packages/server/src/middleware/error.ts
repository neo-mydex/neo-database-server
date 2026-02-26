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

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      code: err.statusCode,
      message: err.message,
      data: null,
    })
  }

  return res.status(500).json({
    code: 500,
    message: err.message || 'Internal server error',
    data: null,
  })
}

/**
 * 404 处理中间件
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    code: 404,
    message: 'Not found',
    data: null,
  })
}

/**
 * 统一成功响应包装
 */
export function successResponse<T>(data: T, meta?: Record<string, any>) {
  return { code: 200, message: 'success', data, ...(meta ? { meta } : {}) }
}

/**
 * 异步路由包装器，自动捕获错误
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
