/**
 * Chat API 测试脚本 (v2)
 * 测试 ai_chatbot_sessions 表对应的所有接口：
 *
 * 有鉴权接口（需要 JWT）：
 *   GET    /ai-api/chats/sessions
 *   GET    /ai-api/chats/sessions/:sessionId
 *   DELETE /ai-api/chats/sessions/:sessionId
 *   POST   /ai-api/chats/sessions/:sessionId/stream
 *   GET    /ai-api/chats/messages?sessionId=xxx
 *   POST   /ai-api/chats/messages
 *   PATCH  /ai-api/chats/messages/:id
 *   DELETE /ai-api/chats/messages/:id
 *
 * 无鉴权接口（供后台/测试）：
 *   GET    /ai-api/chats/sessions/by-user/:userId
 *
 * 用法：
 *   JWT=<token> tsx chat-test.ts          # 完整测试（含鉴权）
 *   tsx chat-test.ts                       # 仅测无鉴权接口 + 鉴权拦截检查
 */

import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../.env') })

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const JWT = process.env.JWT || ''

// seed 数据里的已知数据（无需 JWT 即可验证）
const SEED_USER_ID  = 'did:privy:0x1234567890abcdef1234567890abcdef12345678'
const SEED_SESSION1 = 'a1b2c3d4-0001-0001-0001-000000000001'
const SEED_SESSION2 = 'a1b2c3d4-0002-0002-0002-000000000002'

// 当前 JWT 对应的用户（从 token sub 字段得到）
// 注意：JWT 用户和 seed 用户不同，测试时只能访问自己创建的数据
const JWT_USER_ID = 'did:privy:cmm0pj9s1000d0cl73ozx0ysy'

// ─── 工具 ──────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function section(title: string) {
  console.log('\n' + '─'.repeat(62))
  console.log(`  ${title}`)
  console.log('─'.repeat(62))
}

function ok(label: string) { passed++; console.log(`  ✅ ${label}`) }
function fail(label: string, detail?: any) {
  failed++
  console.log(`  ❌ ${label}`)
  if (detail !== undefined) console.log(`     → `, detail)
}
function assert(cond: boolean, label: string, detail?: any) {
  cond ? ok(label) : fail(label, detail)
}
function skip(label: string) { console.log(`  ⏭️  ${label}（跳过，无 JWT）`) }

async function req(endpoint: string, options?: RequestInit & { token?: string }) {
  const { token, ...rest } = options ?? {}
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE_URL}${endpoint}`, { ...rest, headers })
  let data: any = null
  try { data = await res.json() } catch {}
  return { status: res.status, ok: res.ok, data, res }
}

// ─── 无鉴权接口 ────────────────────────────────────────────────────

async function testByUserId() {
  section('GET /sessions/by-user/:userId — 无鉴权，查 seed 用户的会话列表')
  const r = await req(`/ai-api/chats/sessions/by-user/${SEED_USER_ID}`)
  console.log(`  HTTP ${r.status}`)
  assert(r.ok, 'HTTP 200')
  assert(Array.isArray(r.data?.data), '返回数组')
  assert((r.data?.meta?.count ?? 0) >= 3, `会话数 >= 3（seed 有 3 个会话，得到: ${r.data?.meta?.count}）`)

  const sessions: any[] = r.data?.data ?? []
  if (sessions.length > 0) {
    const s = sessions[0]
    assert(typeof s.session_id === 'string',  'session_id 是字符串')
    assert(s.user_id === SEED_USER_ID,         'user_id 正确')
    assert(typeof s.message_count === 'number','message_count 是数字')
    assert(typeof s.last_message_at === 'number', 'last_message_at 是毫秒时间戳')
    assert(typeof s.first_question === 'string',  'first_question 是字符串')
    // 按最后消息时间倒序，第一个应该是最近的会话（session4，2026-02-26）
    assert(sessions[0].session_id === 'a1b2c3d4-0004-0004-0004-000000000004', '第一个会话是最新的（session4）')
  }
}

// ─── 鉴权拦截检查（无 token → 401）─────────────────────────────────

async function testAuthBlocking() {
  section('鉴权拦截：无 token 的请求应返回 401')
  const endpoints = [
    { method: 'GET',    path: '/ai-api/chats/sessions' },
    { method: 'GET',    path: '/ai-api/chats/sessions/some-session-id' },
    { method: 'DELETE', path: '/ai-api/chats/sessions/some-session-id' },
    { method: 'POST',   path: '/ai-api/chats/sessions/some-session-id/stream' },
    { method: 'GET',    path: '/ai-api/chats/messages?sessionId=x' },
    { method: 'POST',   path: '/ai-api/chats/messages' },
    { method: 'PATCH',  path: '/ai-api/chats/messages/1' },
    { method: 'DELETE', path: '/ai-api/chats/messages/1' },
  ]
  for (const ep of endpoints) {
    const r = await req(ep.path, { method: ep.method })
    assert(r.status === 401, `${ep.method} ${ep.path} → 401（得到: ${r.status}）`)
  }
}

// ─── 有鉴权的完整流程 ───────────────────────────────────────────────

async function testGetMySessions(token: string) {
  section('GET /sessions — JWT 鉴权，获取我的会话列表（新用户，初始为空）')
  const r = await req('/ai-api/chats/sessions', { token })
  console.log(`  HTTP ${r.status}`)
  assert(r.ok, 'HTTP 200')
  assert(Array.isArray(r.data?.data), '返回数组')
  // 新用户初始没有会话，只要接口正常返回即可
  assert(typeof r.data?.meta?.count === 'number', `meta.count 是数字（得到: ${r.data?.meta?.count}）`)
  console.log(`  当前会话数: ${r.data?.meta?.count}`)
  return r.data?.data as any[]
}

async function testGetSessionById(token: string, sessionId: string) {
  section(`GET /sessions/${sessionId} — JWT 鉴权，获取自己创建的会话详情`)
  const r = await req(`/ai-api/chats/sessions/${sessionId}`, { token })
  console.log(`  HTTP ${r.status}`)
  assert(r.ok, 'HTTP 200')
  assert(r.data?.data?.session_id === sessionId, 'session_id 正确')
  assert(typeof r.data?.data?.message_count === 'number', `有 message_count（得到: ${r.data?.data?.message_count}）`)
  assert(typeof r.data?.data?.first_question === 'string', '有 first_question')
}

async function testGetSessionForbidden(token: string) {
  section(`GET /sessions/${SEED_SESSION1} — 访问他人会话应返回 403`)
  const r = await req(`/ai-api/chats/sessions/${SEED_SESSION1}`, { token })
  console.log(`  HTTP ${r.status}`)
  assert(r.status === 403, `HTTP 403（归属校验正确，得到: ${r.status}）`)
}

async function testGetSessionNotFound(token: string) {
  section('GET /sessions/nonexistent — 不存在的会话应返回 404')
  const r = await req('/ai-api/chats/sessions/session-does-not-exist-xyz', { token })
  console.log(`  HTTP ${r.status}`)
  assert(r.status === 404, 'HTTP 404')
}

async function testGetMessages(token: string, sessionId: string) {
  section(`GET /messages?sessionId=${sessionId} — JWT 鉴权，查自己的会话消息`)
  const r = await req(`/ai-api/chats/messages?sessionId=${sessionId}`, { token })
  console.log(`  HTTP ${r.status}`)
  assert(r.ok, 'HTTP 200')
  assert(Array.isArray(r.data?.data), '返回数组')
  assert((r.data?.meta?.count ?? 0) >= 1, `消息数 >= 1（得到: ${r.data?.meta?.count}）`)

  const msgs: any[] = r.data?.data ?? []
  if (msgs.length >= 1) {
    assert(msgs[0].user_id === JWT_USER_ID, `user_id 是当前登录用户（得到: ${msgs[0].user_id}）`)
    assert(typeof msgs[0].created_at === 'number', 'created_at 是毫秒时间戳')
  }
}

async function testGetMessagesForbidden(token: string) {
  section(`GET /messages?sessionId=${SEED_SESSION2} — 访问他人会话消息应返回 404`)
  const r = await req(`/ai-api/chats/messages?sessionId=${SEED_SESSION2}`, { token })
  console.log(`  HTTP ${r.status}`)
  assert(r.status === 404, `HTTP 404（归属校验正确，得到: ${r.status}）`)
}

async function testGetMessagesMissingParam(token: string) {
  section('GET /messages（缺 sessionId）— 应返回 400')
  const r = await req('/ai-api/chats/messages', { token })
  console.log(`  HTTP ${r.status}`)
  assert(r.status === 400, 'HTTP 400')
}

async function testCreateMessage(token: string): Promise<string | null> {
  const newSessionId = `test-session-${Date.now()}`
  section(`POST /messages — JWT 鉴权，创建消息（session: ${newSessionId}）`)

  const r = await req('/ai-api/chats/messages', {
    method: 'POST',
    token,
    body: JSON.stringify({
      session_id: newSessionId,
      question: 'SOL 现在还能买吗？',
      answer: 'Solana 近期链上活跃度高，生态发展迅速，可以考虑小仓位介入。',
    }),
  })

  console.log(`  HTTP ${r.status}`)
  assert(r.status === 201, 'HTTP 201')
  assert(typeof r.data?.data?.id === 'string', `返回 id（得到: ${r.data?.data?.id}）`)
  assert(r.data?.data?.user_id === JWT_USER_ID, `user_id 从 JWT 注入（得到: ${r.data?.data?.user_id}）`)
  assert(r.data?.data?.session_id === newSessionId, 'session_id 正确')
  assert(typeof r.data?.data?.created_at === 'number', 'created_at 是毫秒时间戳')

  return r.ok ? r.data.data.id : null
}

async function testCreateMessageValidation(token: string) {
  section('POST /messages（缺字段）— 应返回 400')
  const r = await req('/ai-api/chats/messages', {
    method: 'POST',
    token,
    body: JSON.stringify({ session_id: 'x' }),  // 缺 question / answer
  })
  console.log(`  HTTP ${r.status}`)
  assert(r.status === 400, 'HTTP 400')
}

async function testUpdateMessage(token: string, msgId: string) {
  section(`PATCH /messages/${msgId} — JWT 鉴权，更新消息`)
  const r = await req(`/ai-api/chats/messages/${msgId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ answer: '更新后：SOL 已回调，可以关注支撑位。' }),
  })
  console.log(`  HTTP ${r.status}`)
  assert(r.ok, 'HTTP 200')
  assert(r.data?.data?.id === msgId, 'id 匹配')
  assert((r.data?.data?.answer ?? '').includes('更新后'), 'answer 已更新')
}

async function testUpdateMessageNotFound(token: string) {
  section('PATCH /messages/<nonexistent-uuid> — 不存在/不属于我的消息，应返回 404')
  const r = await req('/ai-api/chats/messages/00000000-0000-0000-0000-000000000000', {
    method: 'PATCH',
    token,
    body: JSON.stringify({ answer: '不存在' }),
  })
  console.log(`  HTTP ${r.status}`)
  assert(r.status === 404, 'HTTP 404')
}

// SSE 通用读取工具：发送请求，返回所有解析好的事件
async function fetchSSE(token: string, sessionId: string, message: string): Promise<{ status: number; contentType: string; events: any[] }> {
  const res = await fetch(`${BASE_URL}/ai-api/chats/sessions/${sessionId}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message, context: JSON.stringify({ source: '/home' }) }),
  })

  const contentType = res.headers.get('content-type') ?? ''
  const events: any[] = []

  if (res.ok) {
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let raw = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      raw += decoder.decode(value, { stream: true })
    }
    raw.split('\n').forEach(line => {
      if (line.startsWith('data: ')) {
        try {
          const outer = JSON.parse(line.slice(6))
          events.push({ ...outer, data: JSON.parse(outer.data) })
        } catch {}
      }
    })
  }

  return { status: res.status, contentType, events }
}

async function testStream(token: string) {
  const sessionId = `test-stream-${Date.now()}`
  section(`POST /sessions/${sessionId}/stream — 纯文字（无关键词）`)

  const { status, contentType, events } = await fetchSSE(token, sessionId, '帮我看看 BTC')

  assert(status === 200, `HTTP 200（得到: ${status}）`)
  assert(contentType.includes('text/event-stream'), `Content-Type = text/event-stream`)

  const types = events.map(e => e.type)
  console.log(`  收到 ${events.length} 个 SSE 事件`)
  assert(types[0] === 'session_start', `首个事件是 session_start`)
  assert(types[types.length - 1] === 'session_end', `末尾事件是 session_end`)

  const tokens = events.filter(e => e.type === 'llm_token')
  assert(tokens.length > 0, `有 llm_token（得到: ${tokens.length} 个）`)
  assert(events.filter(e => e.type === 'tool_call_start' || e.type === 'tool_call_complete').length === 0, `无 tool_call 事件（纯文字场景）`)

  const text = tokens.map(e => e.data.content).join('')
  console.log(`  重组文本: "${text}"`)
  assert(events.every(e => typeof e.ts === 'number'), '所有事件有 ts 字段')

  const sessionEnd = events.find(e => e.type === 'session_end')
  assert(typeof sessionEnd?.data?.message_id === 'string', `session_end 携带 message_id（得到: ${sessionEnd?.data?.message_id}）`)
  const messageId = sessionEnd?.data?.message_id as string
  console.log(`  落库 message_id: ${messageId}`)

  // ── 验证落库内容 ──
  section(`  验证落库：GET /messages?sessionId=${sessionId}`)
  const r = await req(`/ai-api/chats/messages?sessionId=${sessionId}`, { token })
  assert(r.ok, '落库查询 HTTP 200')
  const msgs: any[] = r.data?.data ?? []
  assert(msgs.length === 1, `恰好 1 条记录（得到: ${msgs.length}）`)
  const m = msgs[0]
  assert(m?.id === messageId, `message_id 与数据库 id 一致（得到: ${m?.id}）`)
  assert(m?.question === '帮我看看 BTC', `question 正确落库（得到: ${m?.question}）`)
  assert(m?.answer === text, `answer 正确落库（得到: "${m?.answer}"）`)
  assert(Array.isArray(m?.tools) && m.tools.length === 0, `tools 为空数组（得到: ${JSON.stringify(m?.tools)}）`)
  assert(Array.isArray(m?.client_actions) && m.client_actions.length === 0, `client_actions 为空数组（得到: ${JSON.stringify(m?.client_actions)}）`)
  console.log(`  question_verbose: ${JSON.stringify(m?.question_verbose)}`)
}

async function testStreamSwap(token: string) {
  const sessionId = `test-stream-swap-${Date.now()}`
  section(`POST /sessions/${sessionId}/stream — swap 流程（含 tool_call + OPEN_TRADE_WINDOW）`)

  const { status, events } = await fetchSSE(token, sessionId, '我想 swap 一些 ETH')
  assert(status === 200, `HTTP 200（得到: ${status}）`)

  const types = events.map(e => e.type)
  console.log(`  收到 ${events.length} 个 SSE 事件，类型序列: ${types.join(' → ')}`)
  assert(types[0] === 'session_start', `首个事件是 session_start`)
  assert(types[types.length - 1] === 'session_end', `末尾事件是 session_end`)

  const toolStart = events.find(e => e.type === 'tool_call_start')
  assert(!!toolStart, '有 tool_call_start 事件')
  assert(toolStart?.data?.tool === 'create_trade_intent', `tool = create_trade_intent（得到: ${toolStart?.data?.tool}）`)
  assert(toolStart?.data?.content === 'Executing create_trade_intent tool...', `tool_call_start 有 content（得到: ${toolStart?.data?.content}）`)
  assert(typeof toolStart?.data?.callId === 'string', 'tool_call_start 有 callId')

  const toolComplete = events.find(e => e.type === 'tool_call_complete')
  assert(!!toolComplete, '有 tool_call_complete 事件')
  assert(toolComplete?.data?.callId === toolStart?.data?.callId, 'callId 前后一致')
  assert(toolComplete?.data?.result?.status === 'success', 'result.status = success')

  const clientAction = toolComplete?.data?.result?.data?.client_action
  assert(!!clientAction, '有 client_action')
  assert(clientAction?.type === 'OPEN_TRADE_WINDOW', `client_action.type = OPEN_TRADE_WINDOW（得到: ${clientAction?.type}）`)

  const params = clientAction?.params
  assert(typeof params?.symbol === 'string', `params.symbol 存在（得到: ${params?.symbol}）`)
  assert(typeof params?.side === 'string', `params.side 存在（得到: ${params?.side}）`)
  assert(params?.tradeType === 'SPOT', `params.tradeType = SPOT（得到: ${params?.tradeType}）`)
  assert(typeof params?.network === 'string', `params.network 存在（得到: ${params?.network}）`)
  assert(typeof params?.amountUsd === 'string', `params.amountUsd 存在（得到: ${params?.amountUsd}）`)
  console.log(`  client_action.params: ${JSON.stringify(params)}`)

  const firstTokenIdx = types.indexOf('llm_token')
  const toolStartIdx = types.indexOf('tool_call_start')
  const toolCompleteIdx = types.indexOf('tool_call_complete')
  const lastTokenIdx = types.lastIndexOf('llm_token')
  assert(firstTokenIdx < toolStartIdx, '前段 llm_token 在 tool_call_start 之前')
  assert(toolCompleteIdx < lastTokenIdx, '后段 llm_token 在 tool_call_complete 之后')

  const sessionEnd = events.find(e => e.type === 'session_end')
  const messageId = sessionEnd?.data?.message_id as string

  // ── 验证落库内容 ──
  section(`  验证落库：GET /messages?sessionId=${sessionId}`)
  const r = await req(`/ai-api/chats/messages?sessionId=${sessionId}`, { token })
  assert(r.ok, '落库查询 HTTP 200')
  const msgs: any[] = r.data?.data ?? []
  assert(msgs.length === 1, `恰好 1 条记录（得到: ${msgs.length}）`)
  const m = msgs[0]
  assert(m?.id === messageId, `message_id 与数据库 id 一致`)
  assert(m?.question === '我想 swap 一些 ETH', `question 正确落库（得到: ${m?.question}）`)
  assert(Array.isArray(m?.tools) && m.tools.includes('create_trade_intent'), `tools 含 create_trade_intent（得到: ${JSON.stringify(m?.tools)}）`)
  assert(Array.isArray(m?.client_actions) && m.client_actions.includes('OPEN_TRADE_WINDOW'), `client_actions 含 OPEN_TRADE_WINDOW（得到: ${JSON.stringify(m?.client_actions)}）`)
  console.log(`  answer: "${m?.answer}"`)
}

async function testStreamDeposit(token: string) {
  const sessionId = `test-stream-deposit-${Date.now()}`
  section(`POST /sessions/${sessionId}/stream — deposit 流程（含 tool_call + SHOW_DEPOSIT_PROMPT）`)

  const { status, events } = await fetchSSE(token, sessionId, '我想充值 USDC')
  assert(status === 200, `HTTP 200（得到: ${status}）`)

  const types = events.map(e => e.type)
  console.log(`  收到 ${events.length} 个 SSE 事件，类型序列: ${types.join(' → ')}`)
  assert(types[0] === 'session_start', `首个事件是 session_start`)
  assert(types[types.length - 1] === 'session_end', `末尾事件是 session_end`)

  const toolStart = events.find(e => e.type === 'tool_call_start')
  assert(!!toolStart, '有 tool_call_start 事件')
  assert(toolStart?.data?.tool === 'show_deposit_prompt', `tool = show_deposit_prompt（得到: ${toolStart?.data?.tool}）`)
  assert(toolStart?.data?.content === 'Executing show_deposit_prompt tool...', `tool_call_start 有 content（得到: ${toolStart?.data?.content}）`)

  const toolComplete = events.find(e => e.type === 'tool_call_complete')
  assert(!!toolComplete, '有 tool_call_complete 事件')
  assert(toolComplete?.data?.callId === toolStart?.data?.callId, 'callId 前后一致')

  const clientAction = toolComplete?.data?.result?.data?.client_action
  assert(!!clientAction, '有 client_action')
  assert(clientAction?.type === 'SHOW_DEPOSIT_PROMPT', `client_action.type = SHOW_DEPOSIT_PROMPT（得到: ${clientAction?.type}）`)

  const params = clientAction?.params
  assert(typeof params?.network === 'string', `params.network 存在（得到: ${params?.network}）`)
  assert(typeof params?.address === 'string', `params.address 存在（得到: ${params?.address}）`)
  assert((params?.address ?? '').startsWith('0x'), `params.address 是 EVM 格式`)
  console.log(`  client_action.params: ${JSON.stringify(params)}`)

  const firstTokenIdx = types.indexOf('llm_token')
  const toolStartIdx = types.indexOf('tool_call_start')
  const toolCompleteIdx = types.indexOf('tool_call_complete')
  const lastTokenIdx = types.lastIndexOf('llm_token')
  assert(firstTokenIdx < toolStartIdx, '前段 llm_token 在 tool_call_start 之前')
  assert(toolCompleteIdx < lastTokenIdx, '后段 llm_token 在 tool_call_complete 之后')

  const sessionEnd = events.find(e => e.type === 'session_end')
  const messageId = sessionEnd?.data?.message_id as string

  // ── 验证落库内容 ──
  section(`  验证落库：GET /messages?sessionId=${sessionId}`)
  const r = await req(`/ai-api/chats/messages?sessionId=${sessionId}`, { token })
  assert(r.ok, '落库查询 HTTP 200')
  const msgs: any[] = r.data?.data ?? []
  assert(msgs.length === 1, `恰好 1 条记录（得到: ${msgs.length}）`)
  const m = msgs[0]
  assert(m?.id === messageId, `message_id 与数据库 id 一致`)
  assert(m?.question === '我想充值 USDC', `question 正确落库（得到: ${m?.question}）`)
  assert(Array.isArray(m?.tools) && m.tools.includes('show_deposit_prompt'), `tools 含 show_deposit_prompt（得到: ${JSON.stringify(m?.tools)}）`)
  assert(Array.isArray(m?.client_actions) && m.client_actions.includes('SHOW_DEPOSIT_PROMPT'), `client_actions 含 SHOW_DEPOSIT_PROMPT（得到: ${JSON.stringify(m?.client_actions)}）`)
  console.log(`  answer: "${m?.answer}"`)
}

async function testDeleteMessage(token: string, msgId: string) {
  section(`DELETE /messages/${msgId} — JWT 鉴权，删除单条消息`)
  const r = await req(`/ai-api/chats/messages/${msgId}`, { method: 'DELETE', token })
  console.log(`  HTTP ${r.status}`)
  assert(r.ok, 'HTTP 200')

  // 再删一次 → 404
  const r2 = await req(`/ai-api/chats/messages/${msgId}`, { method: 'DELETE', token })
  assert(r2.status === 404, '再次删除返回 404')
}

async function testDeleteSessionNotFound(token: string) {
  section('DELETE /sessions/nonexistent — 不存在的会话，应返回 404')
  const r = await req('/ai-api/chats/sessions/session-does-not-exist-xyz', { method: 'DELETE', token })
  console.log(`  HTTP ${r.status}`)
  assert(r.status === 404, 'HTTP 404')
}

async function testDeleteNewSession(token: string) {
  // 先找到刚才创建消息的那个 test-session，从会话列表里找
  const r = await req('/ai-api/chats/sessions', { token })
  const sessions: any[] = r.data?.data ?? []
  const testSession = sessions.find((s: any) => s.session_id.startsWith('test-session-'))

  if (!testSession) {
    skip('找不到测试会话，跳过删除会话测试')
    return
  }

  section(`DELETE /sessions/${testSession.session_id} — JWT 鉴权，删除整个会话`)
  const r2 = await req(`/ai-api/chats/sessions/${testSession.session_id}`, { method: 'DELETE', token })
  console.log(`  HTTP ${r2.status}`)
  assert(r2.ok, 'HTTP 200')

  // 消息应全部消失
  const r3 = await req(`/ai-api/chats/messages?sessionId=${testSession.session_id}`, { token })
  // sessionBelongsToUser → 归属不存在 → 404
  assert(r3.status === 404, '会话删除后消息查询返回 404')

  // 会话本身也不存在
  const r4 = await req(`/ai-api/chats/sessions/${testSession.session_id}`, { token })
  assert(r4.status === 404, '会话已不存在（404）')
}

// ─── 主流程 ────────────────────────────────────────────────────────

async function run() {
  console.log('\n🚀 Chat API 测试 (v2 - ai_chatbot_sessions)')
  console.log(`📍 ${BASE_URL}`)
  console.log(`🔑 JWT: ${JWT ? JWT.slice(0, 30) + '...' : '未提供（仅测无鉴权部分）'}`)

  // ── 无鉴权接口 ──
  await testByUserId()

  // ── 鉴权拦截检查（不需要 JWT） ──
  await testAuthBlocking()

  // ── 有鉴权的完整流程 ──
  if (!JWT) {
    console.log('\n⚠️  未提供 JWT，跳过鉴权接口测试。')
    console.log('   运行方式：JWT=<token> tsx chat-test.ts\n')
  } else {
    const token = JWT

    // 1. 检查初始状态（新用户无会话）
    await testGetMySessions(token)

    // 2. 创建一条消息（这是后续所有查询测试的数据来源）
    const newMsgId = await testCreateMessage(token)
    await testCreateMessageValidation(token)

    // 3. 从会话列表取刚创建的 sessionId
    const sessionsAfterCreate = await req('/ai-api/chats/sessions', { token })
    const mySession = (sessionsAfterCreate.data?.data ?? []).find(
      (s: any) => s.session_id.startsWith('test-session-')
    )
    const mySessionId = mySession?.session_id

    // 4. 用自己的数据测查询接口
    if (mySessionId) {
      await testGetSessionById(token, mySessionId)
      await testGetMessages(token, mySessionId)
    }

    // 5. 跨用户访问校验（归属保护）
    await testGetSessionForbidden(token)
    await testGetMessagesForbidden(token)
    await testGetSessionNotFound(token)
    await testGetMessagesMissingParam(token)

    // 6. 更新、SSE、删除
    if (newMsgId) {
      await testUpdateMessage(token, newMsgId)
      await testUpdateMessageNotFound(token)

      // 记录 stream 前的 chat_count
      const userBefore = await req(`/ai-api/users/${JWT_USER_ID}`, {})
      const chatCountBefore: number = userBefore.data?.data?.chat_count ?? -1
      console.log(`\n  [chat_count 基准] stream 前: ${chatCountBefore}`)

      await testStream(token)
      await testStreamSwap(token)
      await testStreamDeposit(token)

      // 验证 chat_count 增加了 3（3 次 stream）
      section('chat_count +3 验证（3 次 stream 对话）')
      const userAfter = await req(`/ai-api/users/${JWT_USER_ID}`, {})
      const chatCountAfter: number = userAfter.data?.data?.chat_count ?? -1
      console.log(`  stream 后: ${chatCountAfter}，增量: ${chatCountAfter - chatCountBefore}`)
      assert(chatCountAfter === chatCountBefore + 3, `chat_count 增加了 3（${chatCountBefore} → ${chatCountAfter}）`)

      await testDeleteMessage(token, newMsgId)
    }

    // 7. 清理
    await testDeleteSessionNotFound(token)
    await testDeleteNewSession(token)
  }

  // ── 汇总 ──
  console.log('\n' + '═'.repeat(62))
  console.log(`  测试完成：${passed} 通过，${failed} 失败`)
  console.log('═'.repeat(62) + '\n')

  if (failed > 0) process.exit(1)
}

run().catch(err => {
  console.error('\n💥 测试崩溃:', err)
  process.exit(1)
})
