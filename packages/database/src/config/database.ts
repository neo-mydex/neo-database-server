/**
 * 数据库连接配置
 * 使用 PostgreSQL (pg)
 */

import { Client } from 'pg'

/**
 * PostgreSQL 客户端实例
 */
export const client = new Client({
  host: 'mydex-test.c16k8amcamtg.ap-northeast-1.rds.amazonaws.com',
  port: 5432,
  user: 'postgres',
  password: 'SwZJ5r4X260rfTTc9Nog',
  database: 'mydex_v1',
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
