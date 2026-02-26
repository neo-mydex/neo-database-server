# AI Data API 接口文档

## 基础信息

- **Base URL**: `http://216.249.100.66:13658` （临时的，后续可能会变）
- **数据格式**: `application/json`
- **字符编码**: `UTF-8`

## 统一响应格式

### 成功响应
```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

列表接口还会包含 `meta` 字段：
```json
{
  "code": 200,
  "message": "success",
  "data": [ ... ],
  "meta": {
    "count": 3,
    "page": 1,
    "pageSize": 20
  }
}
```

### 错误响应
```json
{
  "code": 404,
  "message": "错误原因描述",
  "data": null
}
```

`code` 与 HTTP 状态码一致：`200` 成功，`400` 参数错误，`401` 未授权，`404` 不存在，`500` 服务器错误。

---

# 接口列表

## 健康检查

**接口地址**: `GET /health`

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2025-02-25T00:00:00.000Z"
}
```

---

## Processed Content（ai_processed_content）

> AI 处理后的内容，包含摘要、分类、风险等级、推荐代币等字段。

### 1. 获取内容列表

**接口地址**: `GET /ai-api/contents/processed`

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
GET /ai-api/contents/processed?page=1&pageSize=20&category=tradable
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
      "source": "twitter",
      "publishedAt": "2025-02-25T00:00:00.000Z",
      "url": null,
      "author": "@DeFiResearch",
      "language": "en",
      "images": ["https://example.com/image.jpg"],
      "social_metrics": null,
      "volatility": "0.85",
      "summary": "链上数据显示三个巨鲸钱包在 48 小时内悄悄买入约 1200 万美元的 ARB",
      "evidence_points": ["判断依据1", "判断依据2"],
      "suggested_questions": [
        { "label": "ARB 现在的价格是多少？", "action": "chat", "chat": { "message": "ARB 现在的价格是多少？" } }
      ],
      "detected_language": "en-US",
      "category": "tradable",
      "risk_level": "medium",
      "tags": ["可交易", "利多"],
      "suggested_tokens": [
        {
          "symbol": "ARB",
          "name": "Arbitrum",
          "relevance_score": 0.95,
          "sentiment": "bullish",
          "confidence": 0.85,
          "chain": "arb",
          "addr": "0x912CE59144191C1204E64559FE8253a0e49E6548"
        }
      ],
      "overall_sentiment": "bullish"
    }
  ],
  "meta": { "count": 20, "page": 1, "pageSize": 20 }
}
```

> `meta.count` 为本次实际返回的数据条数。

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 内容 ID |
| title | string | 标题 |
| content_type | string | 内容类型：news/edu/social |
| content | string | 完整正文 |
| source | string | 数据来源 |
| publishedAt | string | 发布时间（ISO 8601） |
| url | string \| null | 原文链接 |
| author | string \| null | 作者 |
| language | string \| null | 语言代码 |
| images | string[] \| null | 图片 URL 列表 |
| social_metrics | SocialMetrics \| null | 社交数据，仅 content_type=social 时存在 |
| volatility | string | 波动性 0-1（PostgreSQL NUMERIC 返回字符串） |
| summary | string | 省流版摘要 |
| evidence_points | string[] | 判断依据 |
| suggested_questions | SuggestedQuestion[] | 猜你想问 |
| detected_language | string | 检测到的语言：zh-CN/en-US/other |
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
| chat.message | string | 聊天消息（action=chat 时） |
| component.type | string | 组件类型（action=component 时）：assets_card/trade_card/settings_card/profile_card/history_card |
| component.params | object | 组件参数（action=component 时） |

**SuggestedToken 字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| symbol | string | 代币符号 |
| name | string | 代币名称 |
| relevance_score | number | 相关度 0-1 |
| sentiment | string | 情感倾向：bullish/bearish/neutral |
| confidence | number | 置信度 0-1 |
| chain | string \| null | 区块链代号：eth/sol/bsc/polygon/avax/base/op/arb/ftm/movr/glm/aurora/metis/cro |
| addr | string \| null | 代币地址（EVM: 0x 开头，SOL: base58 编码） |

**SocialMetrics 字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| likes | number | 点赞数 |
| retweets | number \| null | 转发数 |
| shares | number \| null | 分享数 |
| replies | number \| null | 回复数 |
| views | number \| null | 浏览数 |
| author_followers | number \| null | 作者粉丝数 |
| is_kol | boolean \| null | 是否为 KOL |
| verified | boolean \| null | 是否已认证 |

---

### 2. 获取个性化推荐内容（新闻推荐流、需要JWT token）

**接口地址**: `GET /ai-api/contents/recommended`

**说明**: 需要 Privy JWT 认证。服务端通过 Token 解析出用户 ID，查询该用户在 `ai_user_profiles` 中的画像后返回内容列表。用户画像（`risk_appetite`、`decision_speed` 等）将用于后续个性化推荐逻辑（当前为预留 TODO）。

**认证**:
```http
Authorization: Bearer <privy_jwt_token>
```

**请求参数**: 与「获取内容列表」完全相同（category/risk_level/content_type/source/language/sort/page/pageSize）

**请求示例**:
```http
GET /ai-api/contents/recommended?page=1&pageSize=20&category=tradable
Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6...
```

**响应示例**:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "count": 20,
    "page": 1,
    "pageSize": 20,
    "userId": "did:privy:xxx"
  }
}
```

> `data` 字段结构与「1. 获取内容列表」完全相同。
> `meta.userId` 为从 Token 解析出的 Privy 用户 ID（`sub` 字段）。

**错误响应**:

| 状态码 | 原因 |
|--------|------|
| 401 | 未携带 Token，或 Token 无效/已过期 |

---

### 3. 获取单条内容

**接口地址**: `GET /ai-api/contents/processed/:id`

**请求示例**:
```http
GET /ai-api/contents/processed/news_001
```

**响应示例**:
```json
{
  "success": true,
  "data": { "id": "news_001", "title": "...", ... }
}
```

**字段说明**: 与「1. 获取内容列表」相同。

---

### 4. 按分类获取内容

**接口地址**: `GET /ai-api/contents/category/:category`

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| category | string | 是 | educational/tradable/macro |

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，从 1 开始，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20，最大 100 |

**请求示例**:
```http
GET /ai-api/contents/category/tradable?page=1&pageSize=20
```

**响应示例**:
```json
{
  "success": true,
  "data": [...],
  "meta": { "count": 20, "page": 1, "pageSize": 20 }
}
```

---

### 5. 按风险等级获取内容

**接口地址**: `GET /ai-api/contents/risk/:riskLevel`

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| riskLevel | string | 是 | low/medium/high |

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，从 1 开始，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20，最大 100 |

**请求示例**:
```http
GET /ai-api/contents/risk/medium?page=1&pageSize=20
```

**响应示例**:
```json
{
  "success": true,
  "data": [...],
  "meta": { "count": 20, "page": 1, "pageSize": 20 }
}
```

---

## Raw Content（ai_raw_content）

> 原始内容，不含 AI 处理结果（无 summary、category、tags 等）。

### 1. 获取单条原始内容

**接口地址**: `GET /ai-api/contents/raw/:id`

**请求示例**:
```http
GET /ai-api/contents/raw/news_001
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "news_001",
    "title": "...",
    "content_type": "news",
    "content": "...",
    "source": "coindesk",
    "publishedAt": "2025-02-25T00:00:00.000Z",
    "url": "https://example.com/article",
    "author": null,
    "language": "en",
    "images": null,
    "social_metrics": null
  }
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 内容 ID |
| title | string | 标题 |
| content_type | string | 内容类型：news/edu/social |
| content | string | 完整正文 |
| source | string | 数据来源 |
| publishedAt | string | 发布时间（ISO 8601） |
| url | string \| null | 原文链接 |
| author | string \| null | 作者 |
| language | string \| null | 语言代码 |
| images | string[] \| null | 图片 URL 列表 |
| social_metrics | SocialMetrics \| null | 社交数据（结构同上） |

---

## User Profiles（ai_user_profiles）

### 1. 创建用户

**接口地址**: `POST /ai-api/users`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | string | 是 | 用户 ID（如 did:privy:xxx） |
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

**响应示例** (HTTP 201):
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
    "registered_at": "2025-02-25T00:00:00.000Z",
    "trade_count": 0
  }
}
```

> 维度字段由 PostgreSQL NUMERIC 类型返回，格式为字符串（如 `"5.0"`）。

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | string | 用户 ID |
| risk_appetite | string | 风险偏好（字符串格式，如 "5.0"） |
| patience | string | 耐心程度（字符串格式） |
| info_sensitivity | string | 信息敏感度（字符串格式） |
| decision_speed | string | 决策速度（字符串格式） |
| cat_type | string | 用户分类标签 |
| cat_desc | string | 用户分类描述 |
| registered_at | string | 注册时间（ISO 8601） |
| trade_count | number | 交易次数 |

---

### 2. 获取用户信息

**接口地址**: `GET /ai-api/users/:userId`

**请求示例**:
```http
GET /ai-api/users/did:privy:123
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
    "registered_at": "2025-02-25T00:00:00.000Z",
    "trade_count": 0
  }
}
```

**字段说明**: 与「创建用户」相同。

---

### 3. 更新用户维度

**接口地址**: `PATCH /ai-api/users/:userId/traits`

**请求参数**（至少传一个）:

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

### 4. 交易次数 +1

**接口地址**: `PATCH /ai-api/users/:userId/trade-count`

**请求示例**:
```http
PATCH /ai-api/users/did:privy:123/trade-count
```

**响应示例**:
```json
{
  "success": true,
  "data": { "message": "交易次数已更新" }
}
```

---

### 5. 删除用户

**接口地址**: `DELETE /ai-api/users/:userId`

**请求示例**:
```http
DELETE /ai-api/users/did:privy:123
```

**响应示例**:
```json
{
  "success": true,
  "data": { "message": "删除成功" }
}
```

---

## Chat（ai_chat）

> 注意：`user_id` 为**数字类型**（整数），与 User Profiles 中的 `user_id`（字符串）是不同的字段。

### 1. 创建聊天记录

**接口地址**: `POST /ai-api/chats`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | number | 是 | 用户 ID（整数） |
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

**响应示例** (HTTP 201):
```json
{
  "success": true,
  "data": {
    "id": 106,
    "user_id": 35,
    "session_id": "479551b8-4e78-4271-936d-cf66917105a3",
    "question": "SOL 最新市场动态",
    "answer": "Solana 价格当前为 139.76 USDT",
    "created_at": "2025-02-25T00:00:00.000Z",
    "updated_at": "2025-02-25T00:00:00.000Z"
  }
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 聊天记录 ID（自增整数） |
| user_id | number | 用户 ID（整数） |
| session_id | string | 会话 ID |
| question | string | 问题 |
| answer | string | 回答 |
| created_at | string | 创建时间（ISO 8601） |
| updated_at | string | 更新时间（ISO 8601） |

---

### 2. 获取单条聊天记录

**接口地址**: `GET /ai-api/chats/:id`

**请求示例**:
```http
GET /ai-api/chats/106
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
    "created_at": "2025-02-25T00:00:00.000Z",
    "updated_at": "2025-02-25T00:00:00.000Z"
  }
}
```

**字段说明**: 与「创建聊天记录」相同。

---

### 3. 获取用户聊天记录

**接口地址**: `GET /ai-api/chats/user/:userId`

**请求示例**:
```http
GET /ai-api/chats/user/35
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
      "created_at": "2025-02-25T00:00:00.000Z",
      "updated_at": "2025-02-25T00:00:00.000Z"
    }
  ],
  "meta": { "count": 5 }
}
```

> `meta.count` 为本次返回的数组长度，记录按 `created_at ASC` 排序。

---

### 4. 获取会话聊天记录

**接口地址**: `GET /ai-api/chats/session/:sessionId`

**请求示例**:
```http
GET /ai-api/chats/session/479551b8-4e78-4271-936d-cf66917105a3
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
      "created_at": "2025-02-25T00:00:00.000Z",
      "updated_at": "2025-02-25T00:00:00.000Z"
    }
  ],
  "meta": { "count": 5 }
}
```

> `meta.count` 为本次返回的数组长度，记录按 `created_at ASC` 排序。

---

### 5. 获取用户会话列表

**接口地址**: `GET /ai-api/chats/user/:userId/sessions`

**请求示例**:
```http
GET /ai-api/chats/user/35/sessions
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "session_id": "479551b8-4e78-4271-936d-cf66917105a3",
      "user_id": 35,
      "message_count": "5",
      "last_message_at": "2025-02-25T00:00:00.000Z",
      "first_question": "SOL 最新市场动态"
    }
  ],
  "meta": { "count": 10 }
}
```

> `message_count` 由 PostgreSQL `COUNT(*)` 返回，格式为字符串。列表按 `last_message_at DESC` 排序。

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| session_id | string | 会话 ID |
| user_id | number | 用户 ID |
| message_count | string | 消息数量（字符串格式） |
| last_message_at | string | 最后消息时间（ISO 8601） |
| first_question | string | 第一条问题 |

---

### 6. 更新聊天记录

**接口地址**: `PATCH /ai-api/chats/:id`

**请求参数**（至少传一个）:

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
    "user_id": 35,
    "session_id": "479551b8-4e78-4271-936d-cf66917105a3",
    "question": "SOL 最新市场动态",
    "answer": "更新后的回答",
    "created_at": "2025-02-25T00:00:00.000Z",
    "updated_at": "2025-02-25T00:00:00.000Z"
  }
}
```

**字段说明**: 与「创建聊天记录」相同，返回完整记录。

---

### 7. 删除聊天记录

**接口地址**: `DELETE /ai-api/chats/:id`

**请求示例**:
```http
DELETE /ai-api/chats/106
```

**响应示例**:
```json
{
  "success": true,
  "data": { "message": "删除成功" }
}
```

---

### 8. 删除会话

**接口地址**: `DELETE /ai-api/chats/session/:sessionId`

**请求示例**:
```http
DELETE /ai-api/chats/session/479551b8-4e78-4271-936d-cf66917105a3
```

**响应示例**:
```json
{
  "success": true,
  "data": { "message": "会话已删除" }
}
```

---

# 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或 Token 无效 |
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
