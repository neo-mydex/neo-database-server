/**
 * 数据库连接配置
 * 使用 PostgreSQL (pg)
 */

import { Client } from 'pg'

/**
 * PostgreSQL 客户端实例
 */
export const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
})

/**
 * 连接到数据库
 */
export async function connect() {
  await client.connect()
}

/**
 * 断开数据库连接
 */
export async function disconnect() {
  await client.end()
}
