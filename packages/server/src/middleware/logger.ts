import morgan from 'morgan'
import { Request, Response } from 'express'

/**
 * 自定义日志格式
 */
morgan.token('user-id', (req: Request) => {
  return (req as any).userId || 'anonymous'
})

/**
 * 开发环境日志格式
 */
const developmentFormat = ':method :url :status :response-time ms - :res[content-length]'

/**
 * 生产环境日志格式
 */
const productionFormat = '[:date[iso]] :method :url :status :response-time ms'

/**
 * 日志中间件
 */
export const logger = morgan(
  process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat
)

/**
 * 请求日志中间件（详细版）
 */
export function requestLogger(req: Request, res: Response, next: Function) {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`📡 ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`)
  })

  next()
}
