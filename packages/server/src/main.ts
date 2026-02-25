/**
 * AI Data API 服务器
 *
 * 使用方法：
 * 1. 开发环境：pnpm run dev
 * 2. 生产环境：pnpm run build && pnpm start
 */

import express from 'express'
import cors from 'cors'
import { connect, disconnect } from '@mydex/database'
import { logger, requestLogger } from './middleware/logger'
import { errorHandler, notFoundHandler } from './middleware/error'

// ========== 配置 ==========
const PORT = process.env.PORT || 3000
const API_PREFIX = '/api'

// ========== 创建 Express 应用 ==========
const app = express()

// ========== 中间件 ==========
app.use(cors())                    // 允许跨域请求
app.use(express.json())            // 解析 JSON 请求体
app.use(logger)                    // HTTP 日志
app.use(requestLogger)             // 自定义请求日志

// ========== 健康检查 ==========
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ========== API 路由 ==========
// 👇 在这里添加新的路由，简单明了！

import usersRouter from './routes/users'
import contentsRouter from './routes/contents'
import chatsRouter from './routes/chats'

app.use(`${API_PREFIX}/users`, usersRouter)
app.use(`${API_PREFIX}/contents`, contentsRouter)
app.use(`${API_PREFIX}/chats`, chatsRouter)

// ========== 404 和错误处理 ==========
app.use(notFoundHandler)           // 404 处理
app.use(errorHandler)              // 统一错误处理

// ========== 启动服务器 ==========
async function start() {
  try {
    // 连接数据库
    await connect()
    console.log('✅ 数据库连接成功')

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║           🚀 AI Data API 服务器已启动                         ║
║                                                               ║
║           📍 地址: http://localhost:${PORT}                   ║
║           🏥 健康: http://localhost:${PORT}/health            ║
║                                                               ║
║           📚 API 文档:                                        ║
║              - 用户: /api/users                              ║
║              - 内容: /api/contents                           ║
║              - 聊天: /api/chats                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `)
    })
  } catch (error) {
    console.error('❌ 启动失败:', error)
    process.exit(1)
  }
}

// ========== 优雅关闭 ==========
async function stop() {
  console.log('\n🛑 正在关闭服务器...')
  await disconnect()
  console.log('✅ 数据库连接已关闭')
  process.exit(0)
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)

// 启动
start()
