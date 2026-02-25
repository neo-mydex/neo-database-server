# AI Data API 接口文档

## 基础信息

- **Base URL**: `http://localhost:3000`
- **数据格式**: `application/json`
- **字符编码**: `UTF-8`

## 统一响应格式

### 成功响应
```json
{
  "success": true,
  "data": { ... }
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "message": "错误信息",
    "details": { ... }
  }
}
```

---

# 接口列表

## 1. 获取推荐内容

**接口地址**: `GET /api/contents/processed`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| category | string | 否 | 分类筛选：educational/tradable/macro |
| risk_level | string | 否 | 风险等级筛选：low/medium/high |
| content_type | string | 否 | 内容类型筛选：news/edu/social |
| source | string | 否 | 来源筛选 |
| language | string | 否 | 语言筛选 |
| sort | string | 否 | 排序方式：published_at_desc（默认）/published_at_asc/volatility_desc/volatility_asc |
| page | number | 否 | 页码，从 1 开始，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20，最大 100 |

**请求示例**:
```http
GET /api/contents/processed?page=1&pageSize=20&category=tradable
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "social_004",
      "title": "@DeFiResearch：链上数据显示巨鲸正在悄悄建仓",
      "content_type": "social",
      "content": "On-chain alert: 3 wallets holding 50M+ USDC...",
      "summary": "链上数据显示三个巨鲸钱包在 48 小时内悄悄买入约 1200 万美元的 ARB",
      "tags": ["可交易", "利多"],
      "images": ["https://example.com/image.jpg"],
      "evidence_points": ["判断依据1", "判断依据2"],
      "suggested_questions": [
        { "label": "ARB 现在的价格是多少？", "action": "chat", "chat": { "message": "..." } }
      ],
      "suggested_tokens": [
        { "symbol": "ARB", "name": "Arbitrum", "relevance_score": 0.95, "sentiment": "bullish", "confidence": 0.85, "chain": "arb", "addr": "0x912CE59144191C1204E64559FE8253a0e49E6548" }
      ]
    }
  ],
  "meta": { "count": 20, "page": 1, "pageSize": 20 }
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 内容 ID |
| title | string | 标题 |
| content_type | string | 内容类型：news/edu/social |
| content | string | 完整正文 |
| summary | string | 省流版摘要 |
| source | string | 数据来源 |
| publishedAt | string | 发布时间 |
| url | string \| null | 原文链接 |
| author | string \| null | 作者 |
| language | string \| null | 语言代码 |
| images | string[] \| null | 图片 URL 列表 |
| volatility | string | 波动性 0-1（字符串格式） |
| evidence_points | string[] | 判断依据 |
| suggested_questions | SuggestedQuestion[] | 猜你想问 |
| detected_language | string | 检测到的语言 |
| category | string | 分类：educational/tradable/macro |
| risk_level | string | 风险等级：low/medium/high |
| tags | string[] | 标签列表 |
| suggested_tokens | SuggestedToken[] \| null | 推荐代币 |
| overall_sentiment | string \| null | 整体情感：bullish/bearish/neutral |

**SuggestedQuestion 字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| label | string | 按钮显示文本 |
| action | string | 操作类型：chat/component |
| chat.message | string | 聊天消息（action=chat时） |
| component.type | string | 组件类型（action=component时） |
| component.params | object | 组件参数（action=component时） |

**SuggestedToken 字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| symbol | string | 代币符号 |
| name | string | 代币名称 |
| relevance_score | number | 相关度 0-1 |
| sentiment | string | 情感倾向：bullish/bearish/neutral |
| confidence | number | 置信度 0-1 |
| chain | string \| null | 区块链代号：eth/sol/arb/bsc/polygon/base/op 等 |
| addr | string \| null | 代币地址（EVM: 0x 开头，SOL: base58 编码） |

---

## 2. 获取单条内容详情

**接口地址**: `GET /api/contents/processed/:id`

**请求示例**:
```http
GET /api/contents/processed/social_004
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "social_004",
    "title": "@DeFiResearch：链上数据显示巨鲸正在悄悄建仓",
    "content_type": "social",
    "content": "On-chain alert: 3 wallets holding 50M+ USDC...",
    "summary": "链上数据显示三个巨鲸钱包在 48 小时内悄悄买入约 1200 万美元的 ARB",
    "tags": ["可交易", "利多"],
    "images": ["https://example.com/image.jpg"],
    "evidence_points": ["判断依据1", "判断依据2"],
    "suggested_questions": [...],
    "suggested_tokens": [...]
  }
}
```

**字段说明**: 与「获取推荐内容」接口相同，参考上方字段说明。

---

## 3. 按分类获取内容

**接口地址**: `GET /api/contents/category/:category`

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| category | string | 是 | 分类：educational/tradable/macro |

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，从 1 开始，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20，最大 100 |

**请求示例**:
```http
GET /api/contents/category/tradable?page=1&pageSize=20
```

**响应示例**:
```json
{
  "success": true,
  "data": [...],
  "meta": { "count": 20, "page": 1, "pageSize": 20 }
}
```

**字段说明**: 与「获取推荐内容」接口相同。

---

## 4. 按风险等级获取内容

**接口地址**: `GET /api/contents/risk/:riskLevel`

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| riskLevel | string | 是 | 风险等级：low/medium/high |

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，从 1 开始，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20，最大 100 |

**请求示例**:
```http
GET /api/contents/risk/medium?page=1&pageSize=20
```

**响应示例**:
```json
{
  "success": true,
  "data": [...],
  "meta": { "count": 20, "page": 1, "pageSize": 20 }
}
```

**字段说明**: 与「获取推荐内容」接口相同。

---

## 5. 创建用户

**接口地址**: `POST /api/users`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | string | 是 | 用户 ID |
| risk_appetite | number | 是 | 风险偏好 1-10 |
| patience | number | 是 | 耐心程度 1-10 |
| info_sensitivity | number | 是 | 信息敏感度 1-10 |
| decision_speed | number | 是 | 决策速度 1-10 |
| cat_type | string | 是 | 用户分类标签 |
| cat_desc | string | 是 | 用户分类描述 |

**请求示例**:
```json
{
  "user_id": "did:privy:123",
  "risk_appetite": 5,
  "patience": 5,
  "info_sensitivity": 5,
  "decision_speed": 5,
  "cat_type": "均衡的全能喵",
  "cat_desc": "各项指标均衡"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user_id": "did:privy:123",
    "risk_appetite": "5.0",
    "patience": "5.0",
    "info_sensitivity": "5.0",
    "decision_speed": "5.0",
    "cat_type": "均衡的全能喵",
    "cat_desc": "各项指标均衡",
    "registered_at": "2025-02-24T00:00:00.000Z",
    "trade_count": 0
  }
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | string | 用户 ID |
| risk_appetite | string | 风险偏好（字符串格式） |
| patience | string | 耐心程度（字符串格式） |
| info_sensitivity | string | 信息敏感度（字符串格式） |
| decision_speed | string | 决策速度（字符串格式） |
| cat_type | string | 用户分类标签 |
| cat_desc | string | 用户分类描述 |
| registered_at | string | 注册时间 |
| trade_count | number | 交易次数 |

---

## 6. 获取用户信息

**接口地址**: `GET /api/users/:userId`

**请求示例**:
```http
GET /api/users/did:privy:123
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user_id": "did:privy:123",
    "risk_appetite": "5.0",
    "patience": "5.0",
    "info_sensitivity": "5.0",
    "decision_speed": "5.0",
    "cat_type": "均衡的全能喵",
    "cat_desc": "各项指标均衡",
    "registered_at": "2025-02-24T00:00:00.000Z",
    "trade_count": 0
  }
}
```

**字段说明**: 与「创建用户」接口相同。

---

## 7. 更新用户维度

**接口地址**: `PATCH /api/users/:userId/traits`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| risk_appetite | number | 否 | 风险偏好 1-10 |
| patience | number | 否 | 耐心程度 1-10 |
| info_sensitivity | number | 否 | 信息敏感度 1-10 |
| decision_speed | number | 否 | 决策速度 1-10 |

**请求示例**:
```json
{
  "risk_appetite": 7,
  "patience": 3
}
```

**响应示例**:
```json
{
  "success": true,
  "data": { "message": "更新成功" }
}
```

---

## 8. 交易次数 +1

**接口地址**: `PATCH /api/users/:userId/trade-count`

**请求示例**:
```http
PATCH /api/users/did:privy:123/trade-count
```

**响应示例**:
```json
{
  "success": true,
  "data": { "message": "交易次数已更新" }
}
```

---

## 9. 创建聊天记录

**接口地址**: `POST /api/chats`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | number | 是 | 用户 ID |
| session_id | string | 是 | 会话 ID |
| question | string | 是 | 问题 |
| answer | string | 是 | 回答 |

**请求示例**:
```json
{
  "user_id": 35,
  "session_id": "479551b8-4e78-4271-936d-cf66917105a3",
  "question": "SOL 最新市场动态",
  "answer": "Solana 价格当前为 139.76 USDT"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 106,
    "user_id": 35,
    "session_id": "479551b8-4e78-4271-936d-cf66917105a3",
    "question": "SOL 最新市场动态",
    "answer": "Solana 价格当前为 139.76 USDT",
    "created_at": "2025-12-02T19:12:14.540Z",
    "updated_at": "2025-12-02T19:12:14.540Z"
  }
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 聊天记录 ID |
| user_id | number | 用户 ID |
| session_id | string | 会话 ID |
| question | string | 问题 |
| answer | string | 回答 |
| created_at | string | 创建时间 |
| updated_at | string | 更新时间 |

---

## 10. 获取用户聊天记录

**接口地址**: `GET /api/chats/user/:userId`

**请求示例**:
```http
GET /api/chats/user/35
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 106,
      "user_id": 35,
      "session_id": "479551b8-4e78-4271-936d-cf66917105a3",
      "question": "SOL 最新市场动态",
      "answer": "Solana 价格当前为 139.76 USDT",
      "created_at": "2025-12-02T19:12:14.540Z",
      "updated_at": "2025-12-02T19:12:14.540Z"
    }
  ],
  "meta": { "count": 258 }
}
```

**字段说明**: 与「创建聊天记录」接口相同。

---

## 11. 获取会话聊天记录

**接口地址**: `GET /api/chats/session/:sessionId`

**请求示例**:
```http
GET /api/chats/session/479551b8-4e78-4271-936d-cf66917105a3
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 106,
      "user_id": 35,
      "session_id": "479551b8-4e78-4271-936d-cf66917105a3",
      "question": "SOL 最新市场动态",
      "answer": "Solana 价格当前为 139.76 USDT",
      "created_at": "2025-12-02T19:12:14.540Z",
      "updated_at": "2025-12-02T19:12:14.540Z"
    }
  ],
  "meta": { "count": 5 }
}
```

**字段说明**: 与「创建聊天记录」接口相同。

---

## 12. 获取用户会话列表

**接口地址**: `GET /api/chats/user/:userId/sessions`

**请求示例**:
```http
GET /api/chats/user/35/sessions
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "session_id": "479551b8-4e78-4271-936d-cf66917105a3",
      "user_id": 35,
      "message_count": 5,
      "last_message_at": "2025-12-02T19:12:14.540Z",
      "first_question": "SOL 最新市场动态"
    }
  ],
  "meta": { "count": 10 }
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| session_id | string | 会话 ID |
| user_id | number | 用户 ID |
| message_count | number | 消息数量 |
| last_message_at | string | 最后消息时间 |
| first_question | string | 第一个问题 |

---

## 13. 更新聊天记录

**接口地址**: `PATCH /api/chats/:id`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| question | string | 否 | 问题 |
| answer | string | 否 | 回答 |

**请求示例**:
```json
{
  "answer": "更新后的回答"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 106,
    "question": "SOL 最新市场动态",
    "answer": "更新后的回答",
    "updated_at": "2025-12-02T20:00:00.000Z"
  }
}
```

**字段说明**: 与「创建聊天记录」接口相同。

---

## 14. 删除聊天记录

**接口地址**: `DELETE /api/chats/:id`

**请求示例**:
```http
DELETE /api/chats/106
```

**响应示例**:
```json
{
  "success": true,
  "data": { "message": "删除成功" }
}
```

---

## 15. 删除会话

**接口地址**: `DELETE /api/chats/session/:sessionId`

**请求示例**:
```http
DELETE /api/chats/session/479551b8-4e78-4271-936d-cf66917105a3
```

**响应示例**:
```json
{
  "success": true,
  "data": { "message": "会话已删除" }
}
```

---

## 16. 删除用户

**接口地址**: `DELETE /api/users/:userId`

**请求示例**:
```http
DELETE /api/users/did:privy:123
```

**响应示例**:
```json
{
  "success": true,
  "data": { "message": "删除成功" }
}
```

---

# 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如用户已存在） |
| 500 | 服务器内部错误 |

---

# 前端卡片渲染说明

## 卡片预览

使用以下字段渲染卡片列表：

| 字段 | 用途 |
|------|------|
| tags[0] | 显示标签 |
| title | 显示标题 |
| summary | 显示摘要 |
| images[0] | 显示图片 |
| suggested_tokens | 生成右滑交易按钮 |
| suggested_questions | 生成底部问题按钮 |

## 卡片详情

点击卡片后展示完整信息，使用全部字段。

## 按钮交互

- **右滑交易**: suggested_tokens 不为空则显示代币按钮，否则显示 BTC/ETH/SOL
- **猜你想问**: 遍历 suggested_questions 生成按钮，点击后根据 action 类型处理
