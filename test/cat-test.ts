/**
 * cat-test.ts
 * 测试 ai_cat_map 自动联动逻辑
 *
 * 用法：
 *   JWT=<token> tsx cat-test.ts
 *   或直接 tsx cat-test.ts（读取 ../.env 里的 JWT）
 *
 * 依赖：本地服务运行（pnpm dev），且 .env 中 DEV_MODE=true
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../.env') })

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const JWT = process.env.JWT || ''

// DEV_MODE 下 token 的 sub 决定 user_id，从 .env JWT 解析出来的固定用户
const TEST_USER_ID = 'did:privy:cmm0pj9s1000d0cl73ozx0ysy'

if (!JWT) {
  console.error('❌ 未提供 JWT，请在 .env 或环境变量中设置 JWT=<token>')
  process.exit(1)
}

let passed = 0
let failed = 0

function ok(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ✅ ${label}`)
    passed++
  } else {
    console.log(`  ❌ ${label}${detail ? ` — got: ${detail}` : ''}`)
    failed++
  }
}

async function apiPost(path: string, body?: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${JWT}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { status: res.status, data: await res.json() }
}

async function apiDelete(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${JWT}` },
  })
  return res.status
}

// ─── 测试 0：清理残留的测试用户，确保从头开始 ────────────────────────────────
async function cleanup() {
  await apiDelete('/ai-api/users')
}

// ─── 测试 1：新用户空 body → 均衡的全能喵（四维默认 5，全中等）───────────────
async function test1() {
  console.log('\n[1] 新用户空 body 创建 → 均衡的全能喵')
  const { status, data } = await apiPost('/ai-api/users', {})
  ok('HTTP 201', status === 201)
  ok('cat_type = 均衡的全能喵', data.data?.cat_type === '均衡的全能喵', data.data?.cat_type)
  ok('cat_desc 非空', !!data.data?.cat_desc)
  ok('risk_appetite = 5', Number(data.data?.risk_appetite) === 5, String(data.data?.risk_appetite))
  ok('decision_speed = 5', Number(data.data?.decision_speed) === 5, String(data.data?.decision_speed))
}

// ─── 测试 2：POST 更新四维全高分 → 传奇的王者喵 ──────────────────────────────
async function test2() {
  console.log('\n[2] POST 更新四维全高分 (9,9,9,9) → 传奇的王者喵')
  const { status, data } = await apiPost('/ai-api/users', {
    risk_appetite: 9, decision_speed: 9, info_sensitivity: 9, patience: 9,
  })
  ok('HTTP 200（已存在）', status === 200)
  ok('cat_type = 传奇的王者喵', data.data?.cat_type === '传奇的王者喵', data.data?.cat_type)
}

// ─── 测试 3：POST 更新四维全低分 → 迷糊的散步喵 ─────────────────────────────
async function test3() {
  console.log('\n[3] POST 更新四维全低分 (1,1,1,1) → 迷糊的散步喵')
  const { status, data } = await apiPost('/ai-api/users', {
    risk_appetite: 1, decision_speed: 1, info_sensitivity: 1, patience: 1,
  })
  ok('HTTP 200', status === 200)
  ok('cat_type = 迷糊的散步喵', data.data?.cat_type === '迷糊的散步喵', data.data?.cat_type)
}

// ─── 测试 4：POST 只传部分维度 → 合并现有值后重算 ───────────────────────────
async function test4() {
  console.log('\n[4] POST 只更新 risk_appetite=9，其余保持低分 → 鲁莽的送分喵')
  // 当前：全1分 → 只改 risk=9 → (9,1,1,1) → risk=3,speed=1,info=1,patience=1 → 鲁莽的送分喵
  const { status, data } = await apiPost('/ai-api/users', { risk_appetite: 9 })
  ok('HTTP 200', status === 200)
  ok('cat_type = 鲁莽的送分喵', data.data?.cat_type === '鲁莽的送分喵', data.data?.cat_type)
  ok('decision_speed 保持 1', Number(data.data?.decision_speed) === 1, String(data.data?.decision_speed))
}

// ─── 测试 5：边界分数 scoreToLevel 映射 ─────────────────────────────────────
async function test5() {
  console.log('\n[5] 边界分数验证')

  // score=3 → level=1（低上限）→ 全低 → 迷糊的散步喵
  let { data } = await apiPost('/ai-api/users', {
    risk_appetite: 3, decision_speed: 3, info_sensitivity: 3, patience: 3,
  })
  ok('(3,3,3,3) → 迷糊的散步喵', data.data?.cat_type === '迷糊的散步喵', data.data?.cat_type)

  // score=4 → level=2（中下限）→ 全中 → 均衡的全能喵
  ;({ data } = await apiPost('/ai-api/users', {
    risk_appetite: 4, decision_speed: 4, info_sensitivity: 4, patience: 4,
  }))
  ok('(4,4,4,4) → 均衡的全能喵', data.data?.cat_type === '均衡的全能喵', data.data?.cat_type)

  // score=7 → level=2（中上限）→ 全中 → 均衡的全能喵
  ;({ data } = await apiPost('/ai-api/users', {
    risk_appetite: 7, decision_speed: 7, info_sensitivity: 7, patience: 7,
  }))
  ok('(7,7,7,7) → 均衡的全能喵', data.data?.cat_type === '均衡的全能喵', data.data?.cat_type)

  // score=8 → level=3（高下限）→ 全高 → 传奇的王者喵
  ;({ data } = await apiPost('/ai-api/users', {
    risk_appetite: 8, decision_speed: 8, info_sensitivity: 8, patience: 8,
  }))
  ok('(8,8,8,8) → 传奇的王者喵', data.data?.cat_type === '传奇的王者喵', data.data?.cat_type)
}

// ─── 测试 6：传 cat_type/cat_desc 应被服务端忽略并覆盖 ──────────────────────
async function test6() {
  console.log('\n[6] 传 cat_type/cat_desc 被服务端忽略，自动覆盖')
  // 先重置到全5分
  await apiPost('/ai-api/users', {
    risk_appetite: 5, decision_speed: 5, info_sensitivity: 5, patience: 5,
  })
  // 再传假 cat 字段
  const { data } = await apiPost('/ai-api/users', {
    risk_appetite: 5,
    cat_type: '假猫喵',
    cat_desc: '这是假的',
  } as any)
  ok('cat_type 不是假猫喵', data.data?.cat_type !== '假猫喵', data.data?.cat_type)
  ok('cat_type = 均衡的全能喵', data.data?.cat_type === '均衡的全能喵', data.data?.cat_type)
}

// ─── 主流程 ──────────────────────────────────────────────────────────────────
async function run() {
  console.log('🐱 cat-test：猫角色自动联动测试')
  console.log(`📍 ${BASE_URL}  |  用户: ${TEST_USER_ID}`)

  // 先清理，确保用户不存在
  await cleanup()

  try {
    await test1()
    await test2()
    await test3()
    await test4()
    await test5()
    await test6()
  } finally {
    // 测试结束清理用户
    await cleanup()
  }

  console.log(`\n${'─'.repeat(40)}`)
  console.log(`结果：${passed} 通过，${failed} 失败`)
  if (failed > 0) process.exit(1)
}

run().catch(e => { console.error(e); process.exit(1) })
