/**
 * API 测试脚本
 * 测试所有数据库服务器端点
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// 工具函数：延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 工具函数：打印分隔线
const printSection = (title: string) => {
  console.log('\n' + '='.repeat(60))
  console.log(`  ${title}`)
  console.log('='.repeat(60))
}

// 工具函数：发起请求
async function request(endpoint: string, options?: RequestInit) {
  const url = `${BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  const data = await response.json()
  return { status: response.status, ok: response.ok, data }
}

// ========== 测试函数 ==========

async function testHealth() {
  printSection('健康检查')
  const result = await request('/health')
  console.log(`Status: ${result.status}`)
  console.log(JSON.stringify(result.data, null, 2))
}

async function testGetProcessedContents() {
  printSection('获取处理后内容列表')
  const result = await request('/ai-api/contents/processed?page=1&pageSize=3')
  console.log(`Status: ${result.status}`)
  console.log(`Count: ${result.data.meta?.count}`)
  console.log('First item:')
  const first = result.data.data[0]
  console.log(`  - ID: ${first.id}`)
  console.log(`  - Title: ${first.title}`)
  console.log(`  - Category: ${first.category}`)
  console.log(`  - Risk Level: ${first.risk_level}`)

  // 检查 suggested_tokens 中的新字段
  if (first.suggested_tokens && first.suggested_tokens.length > 0) {
    console.log(`  - Suggested Tokens:`)
    first.suggested_tokens.forEach((token: any) => {
      console.log(`    * ${token.symbol}: chain=${token.chain ?? 'null'}, addr=${token.addr ? token.addr.substring(0, 20) + '...' : 'null'}`)
    })
  }
}

async function testLangResolution() {
  printSection('语言解析：Accept-Language header vs ?lang= 参数')

  // 辅助：取第一条内容的 title，传入不同语言配置
  async function fetchTitle(opts: { header?: string; query?: string }): Promise<string> {
    const qs = opts.query ? `?lang=${opts.query}` : ''
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (opts.header) headers['Accept-Language'] = opts.header
    const url = `${BASE_URL}/ai-api/contents/processed/news_001${qs}`
    const res = await fetch(url, { headers })
    const data = await res.json()
    return data.data?.title ?? '(no title)'
  }

  // 1. 无 header 无 lang → zh-CN（中文标题）
  const title_zh = await fetchTitle({})
  console.log(`  无 header 无 lang (expect zh-CN): "${title_zh}"`)

  // 2. ?lang=en-US → 英文标题
  const title_en_query = await fetchTitle({ query: 'en-US' })
  console.log(`  ?lang=en-US (expect en-US):        "${title_en_query}"`)

  // 3. Accept-Language: en → 英文标题
  const title_en_header = await fetchTitle({ header: 'en' })
  console.log(`  Accept-Language: en (expect en-US): "${title_en_header}"`)

  // 4. Accept-Language: zh-cn（小写）→ 中文标题
  const title_zh_lower = await fetchTitle({ header: 'zh-cn' })
  console.log(`  Accept-Language: zh-cn (expect zh-CN): "${title_zh_lower}"`)

  // 5. Accept-Language: zh-tw → 映射到 zh-CN
  const title_zh_tw = await fetchTitle({ header: 'zh-tw' })
  console.log(`  Accept-Language: zh-tw (expect zh-CN): "${title_zh_tw}"`)

  // 6. Accept-Language: ko → 韩文标题
  const title_ko = await fetchTitle({ header: 'ko' })
  console.log(`  Accept-Language: ko (expect ko-KR):    "${title_ko}"`)

  // 7. Accept-Language: ja → 日文标题
  const title_ja = await fetchTitle({ header: 'ja' })
  console.log(`  Accept-Language: ja (expect ja-JP):    "${title_ja}"`)

  // 8. header + query 同时存在 → header 优先（用 curl 验证，Node fetch 会注入系统 Accept-Language）
  const { execSync } = await import('child_process')
  const curl_out = execSync(
    `curl -s "${BASE_URL}/ai-api/contents/processed/news_001?lang=ko-KR" -H "Accept-Language: en"`
  ).toString()
  const curl_title = JSON.parse(curl_out).data?.title ?? ''
  const same_as_en = curl_title === title_en_header
  console.log(`  header=en & ?lang=ko-KR → header 优先 (en-US): ${same_as_en ? '✅' : '❌'} "${curl_title}"`)

  // 9. Accept-Language 带 q 权重（浏览器标准格式）→ 取第一个
  const title_browser = await fetchTitle({ header: 'zh-CN,zh;q=0.9,en-US;q=0.8' })
  console.log(`  Accept-Language: zh-CN,zh;q=0.9,en... (expect zh-CN): "${title_browser}"`)
}

async function testGetContentById() {
  printSection('获取单条内容详情')
  const result = await request('/ai-api/contents/processed/news_001')
  console.log(`Status: ${result.status}`)
  if (result.ok) {
    console.log(`Title: ${result.data.data.title}`)
    console.log(`Summary: ${result.data.data.summary}`)
    console.log(`Tags: ${result.data.data.tags.join(', ')}`)
  }
}

async function testGetByCategory() {
  printSection('按分类获取内容')
  const result = await request('/ai-api/contents/category/tradable?page=1&pageSize=2')
  console.log(`Status: ${result.status}`)
  console.log(`Count: ${result.data.meta?.count}`)
  result.data.data.forEach((item: any, i: number) => {
    console.log(`  ${i + 1}. ${item.title} (${item.category})`)
  })
}

async function testGetByRiskLevel() {
  printSection('按风险等级获取内容')
  const result = await request('/ai-api/contents/risk/medium?page=1&pageSize=2')
  console.log(`Status: ${result.status}`)
  console.log(`Count: ${result.data.meta?.count}`)
  result.data.data.forEach((item: any, i: number) => {
    console.log(`  ${i + 1}. ${item.title} (${item.risk_level})`)
  })
}

// seed 数据中的已知用户（无鉴权测试接口）
const SEED_USER_ID = 'did:privy:0x1234567890abcdef1234567890abcdef12345678'

async function testGetUserById() {
  printSection('获取用户信息（无鉴权，GET /:userId）')
  const result = await request(`/ai-api/users/${SEED_USER_ID}`)
  console.log(`Status: ${result.status}`)
  if (result.ok) {
    console.log(`User ID: ${result.data.data.user_id}`)
    console.log(`Cat Type: ${result.data.data.cat_type}`)
    console.log(`Trade Count: ${result.data.data.trade_count}`)
    console.log(`Chat Count: ${result.data.data.chat_count}`)
    console.log(`Analyse Count: ${result.data.data.analyse_count}`)
    console.log(`Companion Days: ${result.data.data.companion_days}`)
    console.log(`Last Active Date: ${result.data.data.last_active_date}`)
  }
}

async function testCreateUserRequiresAuth() {
  printSection('创建用户（需 JWT，无 token 应返回 401）')
  const result = await request('/ai-api/users', {
    method: 'POST',
    body: JSON.stringify({
      risk_appetite: 7,
      patience: 5,
      info_sensitivity: 8,
      decision_speed: 6,
      cat_type: '激进型',
      cat_desc: '追求高收益，能承受较大风险',
    }),
  })
  console.log(`Status: ${result.status} (expected 401)`)
  const pass = result.status === 401
  console.log(pass ? '✅ 正确拦截无 token 请求' : '❌ 未能拦截')
}

async function testCountEndpointsRequireAuth() {
  printSection('计数接口鉴权检查（无 token 应返回 401）')
  const endpoints = [
    { method: 'PATCH', path: '/ai-api/users/chat-count' },
    { method: 'PATCH', path: '/ai-api/users/analyse-count' },
    { method: 'POST',  path: '/ai-api/users/checkin' },
  ]
  for (const ep of endpoints) {
    const result = await request(ep.path, { method: ep.method })
    const pass = result.status === 401
    console.log(`  ${ep.method} ${ep.path} → ${result.status} ${pass ? '✅' : '❌'}`)
  }
}

async function testCreateChat() {
  printSection('创建聊天记录')
  // 使用数字类型的 user_id，与数据库表结构一致
  const testUserId = Math.floor(Math.random() * 1000000)
  const result = await request('/ai-api/chats', {
    method: 'POST',
    body: JSON.stringify({
      user_id: testUserId,  // 数字类型
      session_id: 'test_session_' + Date.now(),
      question: '测试问题：SOL 现在的价格是多少？',
      answer: '测试回答：Solana 当前价格为 $139.76',
    }),
  })
  console.log(`Status: ${result.status}`)
  if (result.ok) {
    console.log(`Chat ID: ${result.data.data?.id}`)
    console.log(`User ID: ${result.data.data?.user_id}`)
    return { chatId: result.data.data?.id, userId: testUserId }
  } else {
    console.log(`Error: ${result.data.error?.message}`)
    return { chatId: null, userId: testUserId }
  }
}

async function testGetUserChats(userId: number) {
  printSection('获取用户聊天记录')
  const result = await request(`/ai-api/chats/user/${userId}`)
  console.log(`Status: ${result.status}`)
  if (result.ok) {
    console.log(`Count: ${result.data.meta?.count}`)
    result.data.data.forEach((chat: any, i: number) => {
      console.log(`  ${i + 1}. [${chat.id}] ${chat.question.substring(0, 30)}...`)
    })
  }
}

// ========== 主测试流程 ==========

async function runTests() {
  console.log('\n🚀 开始测试 MyDex Database Server API')
  console.log(`📍 服务地址: ${BASE_URL}\n`)

  try {
    // 1. 健康检查
    await testHealth()
    await delay(500)

    // 2. 内容 API 测试
    await testGetProcessedContents()
    await delay(500)

    await testLangResolution()
    await delay(500)

    await testGetContentById()
    await delay(500)

    await testGetByCategory()
    await delay(500)

    await testGetByRiskLevel()
    await delay(500)

    // 3. 用户 API 测试
    await testGetUserById()
    await delay(500)

    await testCreateUserRequiresAuth()
    await delay(500)

    await testCountEndpointsRequireAuth()
    await delay(500)

    // 4. 聊天 API 测试
    const { userId: chatUserId } = await testCreateChat()
    await delay(500)

    if (chatUserId) {
      await testGetUserChats(chatUserId)
    }

    // 完成
    printSection('✅ 所有测试完成')
    console.log('\n测试的用户 ID (user_profiles seed):', SEED_USER_ID)
    console.log('测试的用户 ID (chat):', chatUserId)
    console.log('可以在数据库中查看测试数据\n')

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message)
    console.error('详细错误:', error)
  }
}

// 运行测试
runTests()
