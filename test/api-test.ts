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

async function testCreateUser() {
  printSection('创建用户')
  const testUserId = 'test_user_' + Date.now()
  const result = await request('/ai-api/users', {
    method: 'POST',
    body: JSON.stringify({
      user_id: testUserId,
      risk_appetite: 7,
      patience: 5,
      info_sensitivity: 8,
      decision_speed: 6,
      cat_type: '激进型',
      cat_desc: '追求高收益，能承受较大风险',
    }),
  })
  console.log(`Status: ${result.status}`)
  console.log(`Created: ${result.data.data?.user_id}`)
  return testUserId
}

async function testGetUser(userId: string) {
  printSection('获取用户信息')
  const result = await request(`/ai-api/users/${userId}`)
  console.log(`Status: ${result.status}`)
  if (result.ok) {
    console.log(`User ID: ${result.data.data.user_id}`)
    console.log(`Cat Type: ${result.data.data.cat_type}`)
    console.log(`Trade Count: ${result.data.data.trade_count}`)
  }
}

async function testUpdateUserTraits(userId: string) {
  printSection('更新用户维度')
  const result = await request(`/ai-api/users/${userId}/traits`, {
    method: 'PATCH',
    body: JSON.stringify({
      risk_appetite: 9,
      patience: 3,
    }),
  })
  console.log(`Status: ${result.status}`)
  console.log(`Message: ${result.data.data?.message}`)
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

    await testGetContentById()
    await delay(500)

    await testGetByCategory()
    await delay(500)

    await testGetByRiskLevel()
    await delay(500)

    // 3. 用户 API 测试
    const userId = await testCreateUser()
    await delay(500)

    await testGetUser(userId)
    await delay(500)

    await testUpdateUserTraits(userId)
    await delay(500)

    // 4. 聊天 API 测试
    const { userId: chatUserId } = await testCreateChat()
    await delay(500)

    if (chatUserId) {
      await testGetUserChats(chatUserId)
    }

    // 完成
    printSection('✅ 所有测试完成')
    console.log('\n测试的用户 ID (user_profiles):', userId)
    console.log('测试的用户 ID (chat):', chatUserId)
    console.log('可以在数据库中查看测试数据\n')

  } catch (error: any) {
    console.error('\n❌ 测试失败:', error.message)
    console.error('详细错误:', error)
  }
}

// 运行测试
runTests()
