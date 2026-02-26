import { Request, Response, NextFunction } from 'express'

/**
 * 自定义业务错误类
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
 * 将 PostgreSQL 错误映射为友好的英文 message
 * pg error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
function handlePgError(err: any): { statusCode: number; message: string } {
  switch (err.code) {
    case '23505':
      return { statusCode: 400, message: `Duplicate entry: ${err.constraint ?? 'unique constraint violated'}` }
    case '23502':
      return { statusCode: 400, message: `Missing required field: ${err.column ?? 'unknown'}` }
    case '22P02':
      return { statusCode: 400, message: `Invalid input syntax: ${err.message}` }
    case '22007':
    case '22008':
      return { statusCode: 400, message: `Invalid date/time format` }
    case '22003':
      return { statusCode: 400, message: `Numeric value out of range` }
    case '23503':
      return { statusCode: 400, message: `Referenced record not found: ${err.constraint ?? 'foreign key violated'}` }
    case '08000':
    case '08003':
    case '08006':
      return { statusCode: 503, message: `Database connection error` }
    default:
      // 其他 pg 错误（5位代码），透传 message，状态码 400（通常是客户端数据问题）
      return { statusCode: 400, message: err.message }
  }
}

/**
 * 统一错误处理中间件
 */
export function errorHandler(
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('❌ API Error:', err)

  // 1. 业务错误：主动抛出的 ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      code: err.statusCode,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
      data: null,
    })
  }

  // 2. PostgreSQL 错误：pg 库抛出，有 5 位 code 字段
  const isPgError = typeof (err as any).code === 'string' && /^[0-9A-Z]{5}$/.test((err as any).code)
  if (isPgError) {
    const { statusCode, message } = handlePgError(err)
    return res.status(statusCode).json({
      code: statusCode,
      message,
      ...(process.env.NODE_ENV === 'development' ? { detail: (err as any).detail ?? null } : {}),
      data: null,
    })
  }

  // 3. 其他 JS 运行时错误（代码 bug 等），不暴露细节
  return res.status(500).json({
    code: 500,
    message: 'Internal server error',
    data: null,
  })
}

/**
 * 404 处理中间件
 */
export function notFoundHandler(_req: Request, res: Response) {
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
