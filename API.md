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

参数校验失败（带 `details` 字段说明具体原因）：
```json
{
  "code": 400,
  "message": "Missing required fields",
  "details": {
    "required": ["title", "content_type", "content", "source", "publishedAt"]
  },
  "data": null
}
```

枚举值非法：
```json
{
  "code": 400,
  "message": "Invalid content_type",
  "details": {
    "valid": ["news", "edu", "social"]
  },
  "data": null
}
```

数据库枚举/语法错误（pg 错误透传）：
```json
{
  "code": 400,
  "message": "Invalid input syntax: invalid input value for enum detected_language: \"zh\"",
  "data": null
}
```

资源不存在：
```json
{
  "code": 404,
  "message": "Content not found",
  "data": null
}
```

服务器内部错误：
```json
{
  "code": 500,
  "message": "Internal server error",
  "data": null
}
```

`code` 与 HTTP 状态码一致：`200` 成功，`400` 参数错误，`401` 未授权，`404` 不存在，`409` 冲突，`500` 服务器错误。

**错误分类说明**：
- **业务校验错误**（400/404/409）：`message` 为英文描述，部分附带 `details` 字段说明合法值或必填字段列表
- **数据库错误**（400）：`message` 透传 pg 错误信息，常见如枚举值不合法、字段超长、唯一键冲突等
- **服务器错误**（500）：`message` 固定为 `Internal server error`，不暴露内部细节

---

# 接口列表

## 一、健康检查

**接口地址**: `GET /health`

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2025-02-25T00:00:00.000Z"
}
```

---

## 二、新闻流 Processed Content（ai_processed_content）

> AI 处理后的内容，包含摘要、分类、风险等级、推荐代币等字段。

### 0. 前端渲染说明

#### 新闻预览卡片

| 位置 | 字段 | 备注 |
|------|------|------|
| 左上角标签 | `tags[0]` | 取第一个标签 |
| 图片 | `images[0]` | **仅 `category = educational` 时展示**，其他分类不显示图片 |
| 标题 | `title` | |
| 摘要 | `summary` | |
| 底部按钮 | 固定文案 "AI喵陪你探索web3" | 不来自接口，前端硬编码 |

#### 新闻详情页

| 位置 | 字段 | 备注 |
|------|------|------|
| 标题 | `title` | |
| 图片 | `images[0]` | 同预览，仅 `category = educational` 时展示 |
| 正文 | `content` | 完整原文 |
| AI喵总结 | `summary` | |
| 判断依据 | `evidence_points[]` | 逐条列出 |
| 猜你想问 | `suggested_questions[]` | 全部列出，点击后按 `action` 类型处理 |
| 相关代币 | `suggested_tokens[]` | 见下方说明 |

> **相关代币注意事项**：`suggested_tokens` 只提供 `symbol`（代币符号）和 `addr`（合约地址），**价格需前端自行请求行情接口获取**。`addr` 可能为 null，最差情况下只有 `symbol` 可用，前端需做好兜底处理。

---

### 1. 获取内容列表

**接口地址**: `GET /ai-api/contents/processed`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| lang | string | 否 | 显示语言：zh-CN（默认，中文原文）/en-US（英文）/ja-JP（日文）/ko-KR（韩文）。无对应翻译时 fallback 到中文 |
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
GET /ai-api/contents/processed?page=1&pageSize=20&category=tradable&lang=en-US
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "social_004",
      "title": "@DeFiResearch：链上数据显示巨鲸正在悄悄建仓",
      "content_type": "social",
      "content": "On-chain alert: 3 wallets holding 50M+ USDC...",
      "source": "twitter",
      "publishedAt": 1740441600000,
      "url": null,
      "author": "@DeFiResearch",
      "language": "en",
      "images": ["https://example.com/image.jpg"],
      "social_metrics": null,
      "volatility": "0.85",
      "summary": "链上数据显示三个巨鲸钱包在 48 小时内悄悄买入约 1200 万美元的 ARB",
      "evidence_points": ["判断依据1", "判断依据2"],
      "suggested_questions": [
        { "label": "ARB 现在的价格是多少？", "action": "chat", "payload": "{\"message\":\"ARB 现在的价格是多少？\"}" }
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
| publishedAt | number | 发布时间（Unix 毫秒时间戳） |
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
| payload | string | JSON 字符串，前端自行 `JSON.parse()` 解析。action=chat 时内容为 `{"message":"..."}`；action=component 时内容为 `{"type":"trade_card","params":{...}}` |

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
Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVnRG9ZY3J4elFqanNkVVdUaGVQd2FVUlJHTnZtaGlraEl0SnNQdUFmVUEifQ.eyJzaWQiOiJjbW00ZmpyMm8wMTdyMGNqdmFobXZ6bWFsIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NzIxNjg4MDIsImF1ZCI6ImNtbHVidWxkaTAyZ3MwYmxhbWgwcWV3aXQiLCJzdWIiOiJkaWQ6cHJpdnk6Y21tMGQ0dzB0MDBqZDBjanUyOHF2b3Z1bCIsImV4cCI6MTc3MjI1NTIwMn0.B0QeWG0BFKLHtqOZRya3fMcAn78VH7OeuCp7gBCyU9sgEaHcvHoR3HhBtfim2JYc_-HurQhaya2H314yNJhdXQ
```

**请求参数**: 与「获取内容列表」完全相同（lang 可选，其他参数：category/risk_level/content_type/source/language/sort/page/pageSize）

**请求示例**:
```http
GET /ai-api/contents/recommended?lang=en-US&page=1&pageSize=20&category=tradable
Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVnRG9ZY3J4elFqanNkVVdUaGVQd2FVUlJHTnZtaGlraEl0SnNQdUFmVUEifQ.eyJzaWQiOiJjbW00ZmpyMm8wMTdyMGNqdmFobXZ6bWFsIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NzIxNjg4MDIsImF1ZCI6ImNtbHVidWxkaTAyZ3MwYmxhbWgwcWV3aXQiLCJzdWIiOiJkaWQ6cHJpdnk6Y21tMGQ0dzB0MDBqZDBjanUyOHF2b3Z1bCIsImV4cCI6MTc3MjI1NTIwMn0.B0QeWG0BFKLHtqOZRya3fMcAn78VH7OeuCp7gBCyU9sgEaHcvHoR3HhBtfim2JYc_-HurQhaya2H314yNJhdXQ
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [...],
  "meta": {
    "count": 20,
    "page": 1,
    "pageSize": 20,
    "userId": "did:privy:cmm0d4w0t00jd0cju28qvovul"
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

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| lang | string | 否 | 显示语言：zh-CN（默认，中文原文）/en-US（英文）/ja-JP（日文）/ko-KR（韩文）。无对应翻译时 fallback 到中文 |

**请求示例**:
```http
GET /ai-api/contents/processed/news_001?lang=en-US
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
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
| lang | string | 否 | 显示语言：zh-CN（默认，中文原文）/en-US（英文）/ja-JP（日文）/ko-KR（韩文）。无对应翻译时 fallback 到中文 |
| page | number | 否 | 页码，从 1 开始，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20，最大 100 |

**请求示例**:
```http
GET /ai-api/contents/category/tradable?lang=en-US&page=1&pageSize=20
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
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
| lang | string | 否 | 显示语言：zh-CN（默认，中文原文）/en-US（英文）/ja-JP（日文）/ko-KR（韩文）。无对应翻译时 fallback 到中文 |
| page | number | 否 | 页码，从 1 开始，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20，最大 100 |

**请求示例**:
```http
GET /ai-api/contents/risk/medium?lang=en-US&page=1&pageSize=20
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [...],
  "meta": { "count": 20, "page": 1, "pageSize": 20 }
}
```

---

### 6. 写入翻译（供 AI 翻译脚本调用）

**接口地址**: `POST /ai-api/contents/processed/:id/translations`

**说明**: 写入或更新指定内容的多语言翻译。四种语言均可写入。重复写入同一 lang 时自动覆盖（upsert）。

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 内容 ID |

**请求 Body**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| lang | string | 是 | 语言：zh-CN/en-US/ja-JP/ko-KR |
| title | string | 是 | 翻译后的标题 |
| summary | string | 是 | 翻译后的摘要 |
| content | string | 否 | 翻译后的正文，不传则查询时 fallback 到主表原文 |
| evidence_points | string[] | 否 | 翻译后的判断依据，默认 [] |
| tags | string[] | 否 | 翻译后的标签，默认 [] |
| suggested_questions | array | 否 | 翻译后的猜你想问，默认 [] |

**请求示例**:
```http
POST /ai-api/contents/processed/news_001/translations
Content-Type: application/json
```
```json
{
  "lang": "en-US",
  "title": "Fed holds rates steady",
  "summary": "The Fed kept rates unchanged. Bitcoin briefly surged past $68K before pulling back.",
  "evidence_points": ["Fed statement unchanged", "BTC reacted positively"],
  "tags": ["Macro", "Fed", "BTC"],
  "suggested_questions": [
    { "label": "What next?", "action": "chat", "payload": "{\"message\":\"What happens next?\"}" }
  ]
}
```

**响应示例** (HTTP 201):
```json
{
  "code": 200,
  "message": "success",
  "data": { "message": "Translation saved" }
}
```

**错误响应**:

| 状态码 | 原因 |
|--------|------|
| 400 | lang 缺失、lang 非法、title/summary 缺失 |
| 404 | 对应 content_id 不存在 |

### 7. 批量创建

**接口地址**: `POST /ai-api/contents/processed/batch`

**说明**: 全部成功才提交，任一条失败则整体回滚，不写入任何数据。

**请求 Body**: 数组，每条字段与单条处理后内容相同。

**必填字段**:

| 字段 | 类型 | 说明 |
|------|------|------|
| title | string | 标题 |
| content_type | string | news/edu/social |
| content | string | 正文 |
| source | string | 来源 |
| publishedAt | number | 发布时间（Unix 毫秒时间戳） |
| volatility | number | 波动性 0-1 |
| summary | string | 摘要 |
| evidence_points | string[] | 判断依据 |
| suggested_questions | array | 猜你想问 |
| detected_language | string | zh-CN/en-US/other |
| category | string | educational/tradable/macro |
| risk_level | string | low/medium/high |
| tags | string[] | 标签列表 |

**可选字段**: url、author、language、images、social_metrics、suggested_tokens、overall_sentiment

**请求示例**:
```json
[
  {
    "title": "标题A",
    "content_type": "news",
    "content": "正文A",
    "source": "coindesk",
    "publishedAt": 1767225600000,
    "volatility": 0.85,
    "summary": "摘要A",
    "evidence_points": ["依据1"],
    "suggested_questions": [],
    "detected_language": "zh-CN",
    "category": "tradable",
    "risk_level": "medium",
    "tags": ["BTC"]
  }
]
```

**响应示例** (HTTP 201):
```json
{
  "code": 200,
  "message": "success",
  "data": [ { "id": "content_xxx", "title": "标题A", ... } ],
  "meta": { "count": 1 }
}
```

**错误响应**:

| 状态码 | 原因 |
|--------|------|
| 400 | body 不是数组、数组为空、某条记录缺少必填字段或枚举值无效 |

---

## 三、新闻原文 Raw Content（ai_raw_content，前端不需要看）

> 原始内容，不含 AI 处理结果（无 summary、category、tags 等）。

**RawContent 字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 内容 ID |
| title | string | 标题 |
| content_type | string | 内容类型：news/edu/social |
| content | string | 完整正文 |
| source | string | 数据来源 |
| publishedAt | number | 发布时间（Unix 毫秒时间戳） |
| url | string \| null | 原文链接 |
| author | string \| null | 作者 |
| language | string \| null | 语言代码 |
| images | string[] \| null | 图片 URL 列表 |
| social_metrics | SocialMetrics \| null | 社交数据（结构同上） |

### 1. 获取列表

**接口地址**: `GET /ai-api/contents/raw`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| content_type | string | 否 | 筛选：news/edu/social |
| source | string | 否 | 来源筛选 |
| language | string | 否 | 语言筛选 |
| sort | string | 否 | 排序：published_at_desc（默认）/published_at_asc |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 20，最大 100 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [ { "id": "news_001", "title": "...", ... } ],
  "meta": { "count": 20, "page": 1, "pageSize": 20 }
}
```

### 2. 获取单条

**接口地址**: `GET /ai-api/contents/raw/:id`

**请求示例**:
```http
GET /ai-api/contents/raw/news_001
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "news_001",
    "title": "...",
    "content_type": "news",
    "content": "...",
    "source": "coindesk",
    "publishedAt": 1740441600000,
    "url": "https://example.com/article",
    "author": null,
    "language": "en",
    "images": null,
    "social_metrics": null
  }
}
```

### 3. 创建

**接口地址**: `POST /ai-api/contents/raw`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 是 | 标题 |
| content_type | string | 是 | news/edu/social |
| content | string | 是 | 正文 |
| source | string | 是 | 来源 |
| publishedAt | string | 是 | 发布时间（ISO 8601，写入时传字符串，返回时为毫秒时间戳） |
| url | string | 否 | 原文链接 |
| author | string | 否 | 作者 |
| language | string | 否 | 语言代码 |
| images | string[] | 否 | 图片 URL 列表 |
| social_metrics | SocialMetrics | 否 | 社交数据 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": { "id": "content_xxx", "title": "...", ... }
}
```

### 4. 批量创建

**接口地址**: `POST /ai-api/contents/raw/batch`

**说明**: 全部成功才提交，任一条失败则整体回滚，不写入任何数据。

**请求 Body**: 数组，每条字段与「3. 创建」相同。

**请求示例**:
```json
[
  {
    "title": "标题A",
    "content_type": "news",
    "content": "正文A",
    "source": "coindesk",
    "publishedAt": 1767225600000
  },
  {
    "title": "标题B",
    "content_type": "edu",
    "content": "正文B",
    "source": "medium",
    "publishedAt": 1767225600000
  }
]
```

**响应示例** (HTTP 201):
```json
{
  "code": 200,
  "message": "success",
  "data": [
    { "id": "content_xxx1", "title": "标题A", ... },
    { "id": "content_xxx2", "title": "标题B", ... }
  ],
  "meta": { "count": 2 }
}
```

**错误响应**:

| 状态码 | 原因 |
|--------|------|
| 400 | body 不是数组、数组为空、某条记录缺少必填字段或 content_type 无效 |

---

### 5. 删除

**接口地址**: `DELETE /ai-api/contents/raw/:id`

**请求示例**:
```http
DELETE /ai-api/contents/raw/news_001
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": { "message": "Deleted successfully" }
}
```

---

## 四、猫窝用户信息 User Profiles（ai_user_profiles）

> 除「测试用：按 userId 查询」外，所有接口均需 Privy JWT 认证。user_id 从 Token 中解析，不出现在 URL 里。

### 0. 前端渲染说明

#### 猫窝卡片

| 位置 | 字段 | 备注 |
|------|------|------|
| 猫类型 | `cat_type` | 用户分类标签，如"慢热的守护喵" |
| 猫描述 | `cat_desc` | 用户分类描述文案 |
| 陪伴天数 | `companion_days` | 累计打卡天数 |
| 分析次数 | `chat_count` | AI 对话次数 |

> **打卡注意**：每次用户**登录时**前端需主动调用 `POST /ai-api/users/checkin`，服务端已做幂等处理，同一天多次调用只计一次，不会重复累加。

---

**认证头**:
```http
Authorization: Bearer <privy_jwt_token>
```

**错误响应（认证失败）**:

| 状态码 | 原因 |
|--------|------|
| 401 | 未携带 Token，或 Token 无效/已过期 |

**UserProfile 字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | string | 用户 ID（Privy DID） |
| risk_appetite | string | 风险偏好（NUMERIC，字符串格式，如 "5.0"） |
| patience | string | 耐心程度（字符串格式） |
| info_sensitivity | string | 信息敏感度（字符串格式） |
| decision_speed | string | 决策速度（字符串格式） |
| cat_type | string | 用户分类标签 |
| cat_desc | string | 用户分类描述 |
| registered_at | number | 注册时间（Unix 毫秒时间戳） |
| trade_count | number | 交易次数 |
| chat_count | number | AI 对话次数 |
| analyse_count | number | AI 分析次数 |
| companion_days | number | 陪伴天数（打卡累计） |
| last_active_date | number \| null | 最后打卡日期（Unix 毫秒时间戳，null 表示从未打卡） |

---

### 1. 创建用户

**接口地址**: `POST /ai-api/users`

**认证**: 需要 JWT（user_id 从 token 取，body 不需要传）

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| risk_appetite | number | 是 | 风险偏好 1-10 |
| patience | number | 是 | 耐心程度 1-10 |
| info_sensitivity | number | 是 | 信息敏感度 1-10 |
| decision_speed | number | 是 | 决策速度 1-10 |
| cat_type | string | 是 | 用户分类标签 |
| cat_desc | string | 是 | 用户分类描述 |

**请求示例**:
```http
POST /ai-api/users
Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVnRG9ZY3J4elFqanNkVVdUaGVQd2FVUlJHTnZtaGlraEl0SnNQdUFmVUEifQ.eyJzaWQiOiJjbW00ZmpyMm8wMTdyMGNqdmFobXZ6bWFsIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NzIxNjg4MDIsImF1ZCI6ImNtbHVidWxkaTAyZ3MwYmxhbWgwcWV3aXQiLCJzdWIiOiJkaWQ6cHJpdnk6Y21tMGQ0dzB0MDBqZDBjanUyOHF2b3Z1bCIsImV4cCI6MTc3MjI1NTIwMn0.B0QeWG0BFKLHtqOZRya3fMcAn78VH7OeuCp7gBCyU9sgEaHcvHoR3HhBtfim2JYc_-HurQhaya2H314yNJhdXQ
```
```json
{
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
  "code": 201,
  "message": "success",
  "data": {
    "user_id": "did:privy:cmm0d4w0t00jd0cju28qvovul",
    "risk_appetite": "5.0",
    "patience": "5.0",
    "info_sensitivity": "5.0",
    "decision_speed": "5.0",
    "cat_type": "均衡的全能喵",
    "cat_desc": "各项指标均衡",
    "registered_at": 1772114400000,
    "trade_count": 0,
    "chat_count": 0,
    "analyse_count": 0,
    "companion_days": 0,
    "last_active_date": null
  }
}
```

---

### 2. 获取当前用户信息

**接口地址**: `GET /ai-api/users/`

**认证**: 需要 JWT

**请求示例**:
```http
GET /ai-api/users/
Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVnRG9ZY3J4elFqanNkVVdUaGVQd2FVUlJHTnZtaGlraEl0SnNQdUFmVUEifQ.eyJzaWQiOiJjbW00ZmpyMm8wMTdyMGNqdmFobXZ6bWFsIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NzIxNjg4MDIsImF1ZCI6ImNtbHVidWxkaTAyZ3MwYmxhbWgwcWV3aXQiLCJzdWIiOiJkaWQ6cHJpdnk6Y21tMGQ0dzB0MDBqZDBjanUyOHF2b3Z1bCIsImV4cCI6MTc3MjI1NTIwMn0.B0QeWG0BFKLHtqOZRya3fMcAn78VH7OeuCp7gBCyU9sgEaHcvHoR3HhBtfim2JYc_-HurQhaya2H314yNJhdXQ
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "user_id": "did:privy:cmm0d4w0t00jd0cju28qvovul",
    "risk_appetite": "4.0",
    "patience": "8.5",
    "info_sensitivity": "7.0",
    "decision_speed": "3.0",
    "cat_type": "慢热的守护喵",
    "cat_desc": "你的财富像老树盘根，扎得慢但扎得深。时间是你最好的朋友，耐心是你与生俱来的天赋。",
    "registered_at": 1762084800000,
    "trade_count": 5,
    "chat_count": 2,
    "analyse_count": 2,
    "companion_days": 1,
    "last_active_date": 1772121600000
  }
}
```

---

### 3. 测试用：按 userId 查询（无鉴权）

**接口地址**: `GET /ai-api/users/:userId`

**认证**: 无需认证（仅供测试）

**请求示例**:
```http
GET /ai-api/users/did:privy:cmm0d4w0t00jd0cju28qvovul
```

**响应示例**: 与「获取当前用户信息」相同。

---

### 4. 更新用户维度

**接口地址**: `PATCH /ai-api/users/traits`

**认证**: 需要 JWT

**请求参数**（至少传一个）:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| risk_appetite | number | 否 | 风险偏好 1-10 |
| patience | number | 否 | 耐心程度 1-10 |
| info_sensitivity | number | 否 | 信息敏感度 1-10 |
| decision_speed | number | 否 | 决策速度 1-10 |

**请求示例**:
```http
PATCH /ai-api/users/traits
Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVnRG9ZY3J4elFqanNkVVdUaGVQd2FVUlJHTnZtaGlraEl0SnNQdUFmVUEifQ.eyJzaWQiOiJjbW00ZmpyMm8wMTdyMGNqdmFobXZ6bWFsIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NzIxNjg4MDIsImF1ZCI6ImNtbHVidWxkaTAyZ3MwYmxhbWgwcWV3aXQiLCJzdWIiOiJkaWQ6cHJpdnk6Y21tMGQ0dzB0MDBqZDBjanUyOHF2b3Z1bCIsImV4cCI6MTc3MjI1NTIwMn0.B0QeWG0BFKLHtqOZRya3fMcAn78VH7OeuCp7gBCyU9sgEaHcvHoR3HhBtfim2JYc_-HurQhaya2H314yNJhdXQ
```
```json
{
  "risk_appetite": 7,
  "patience": 3
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": { "message": "Updated successfully" }
}
```

---

### 5. 交易次数 +1

**接口地址**: `PATCH /ai-api/users/trade-count`

**认证**: 需要 JWT

**请求示例**:
```http
PATCH /ai-api/users/trade-count
Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVnRG9ZY3J4elFqanNkVVdUaGVQd2FVUlJHTnZtaGlraEl0SnNQdUFmVUEifQ.eyJzaWQiOiJjbW00ZmpyMm8wMTdyMGNqdmFobXZ6bWFsIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NzIxNjg4MDIsImF1ZCI6ImNtbHVidWxkaTAyZ3MwYmxhbWgwcWV3aXQiLCJzdWIiOiJkaWQ6cHJpdnk6Y21tMGQ0dzB0MDBqZDBjanUyOHF2b3Z1bCIsImV4cCI6MTc3MjI1NTIwMn0.B0QeWG0BFKLHtqOZRya3fMcAn78VH7OeuCp7gBCyU9sgEaHcvHoR3HhBtfim2JYc_-HurQhaya2H314yNJhdXQ
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": { "message": "Trade count updated" }
}
```

---

### 6. AI 对话次数 +1

**接口地址**: `PATCH /ai-api/users/chat-count`

**认证**: 需要 JWT

**请求示例**:
```http
PATCH /ai-api/users/chat-count
Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVnRG9ZY3J4elFqanNkVVdUaGVQd2FVUlJHTnZtaGlraEl0SnNQdUFmVUEifQ.eyJzaWQiOiJjbW00ZmpyMm8wMTdyMGNqdmFobXZ6bWFsIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NzIxNjg4MDIsImF1ZCI6ImNtbHVidWxkaTAyZ3MwYmxhbWgwcWV3aXQiLCJzdWIiOiJkaWQ6cHJpdnk6Y21tMGQ0dzB0MDBqZDBjanUyOHF2b3Z1bCIsImV4cCI6MTc3MjI1NTIwMn0.B0QeWG0BFKLHtqOZRya3fMcAn78VH7OeuCp7gBCyU9sgEaHcvHoR3HhBtfim2JYc_-HurQhaya2H314yNJhdXQ
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": { "message": "Chat count updated" }
}
```

---

### 7. AI 分析次数 +1

**接口地址**: `PATCH /ai-api/users/analyse-count`

**认证**: 需要 JWT

**请求示例**:
```http
PATCH /ai-api/users/analyse-count
Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVnRG9ZY3J4elFqanNkVVdUaGVQd2FVUlJHTnZtaGlraEl0SnNQdUFmVUEifQ.eyJzaWQiOiJjbW00ZmpyMm8wMTdyMGNqdmFobXZ6bWFsIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NzIxNjg4MDIsImF1ZCI6ImNtbHVidWxkaTAyZ3MwYmxhbWgwcWV3aXQiLCJzdWIiOiJkaWQ6cHJpdnk6Y21tMGQ0dzB0MDBqZDBjanUyOHF2b3Z1bCIsImV4cCI6MTc3MjI1NTIwMn0.B0QeWG0BFKLHtqOZRya3fMcAn78VH7OeuCp7gBCyU9sgEaHcvHoR3HhBtfim2JYc_-HurQhaya2H314yNJhdXQ
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": { "message": "Analyse count updated" }
}
```

---

### 8. 打卡（陪伴天数 +1）

**接口地址**: `POST /ai-api/users/checkin`

**认证**: 需要 JWT

**说明**: 幂等操作，同一天多次调用只累加一次。

**请求示例**:
```http
POST /ai-api/users/checkin
Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVnRG9ZY3J4elFqanNkVVdUaGVQd2FVUlJHTnZtaGlraEl0SnNQdUFmVUEifQ.eyJzaWQiOiJjbW00ZmpyMm8wMTdyMGNqdmFobXZ6bWFsIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NzIxNjg4MDIsImF1ZCI6ImNtbHVidWxkaTAyZ3MwYmxhbWgwcWV3aXQiLCJzdWIiOiJkaWQ6cHJpdnk6Y21tMGQ0dzB0MDBqZDBjanUyOHF2b3Z1bCIsImV4cCI6MTc3MjI1NTIwMn0.B0QeWG0BFKLHtqOZRya3fMcAn78VH7OeuCp7gBCyU9sgEaHcvHoR3HhBtfim2JYc_-HurQhaya2H314yNJhdXQ
```

**响应示例（首次打卡）**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "companion_days": 1,
    "already_checked_in": false
  }
}
```

**响应示例（当天重复打卡）**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "companion_days": 1,
    "already_checked_in": true
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| companion_days | number | 当前累计陪伴天数 |
| already_checked_in | boolean | 今天是否已打过卡（true = 本次不计入） |

---

### 9. 删除当前用户

**接口地址**: `DELETE /ai-api/users/`

**认证**: 需要 JWT

**请求示例**:
```http
DELETE /ai-api/users/
Authorization: Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjVnRG9ZY3J4elFqanNkVVdUaGVQd2FVUlJHTnZtaGlraEl0SnNQdUFmVUEifQ.eyJzaWQiOiJjbW00ZmpyMm8wMTdyMGNqdmFobXZ6bWFsIiwiaXNzIjoicHJpdnkuaW8iLCJpYXQiOjE3NzIxNjg4MDIsImF1ZCI6ImNtbHVidWxkaTAyZ3MwYmxhbWgwcWV3aXQiLCJzdWIiOiJkaWQ6cHJpdnk6Y21tMGQ0dzB0MDBqZDBjanUyOHF2b3Z1bCIsImV4cCI6MTc3MjI1NTIwMn0.B0QeWG0BFKLHtqOZRya3fMcAn78VH7OeuCp7gBCyU9sgEaHcvHoR3HhBtfim2JYc_-HurQhaya2H314yNJhdXQ
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": { "message": "Deleted successfully" }
}
```

---

## 五、AI 对话记录 Chatbot Sessions（ai_chatbot_sessions）

> 底层数据表已从 `ai_chat`（整数 user_id）迁移至 `ai_chatbot_sessions`（Privy ID 字符串），与 User Profiles 体系完全打通。
>
> **除「测试用：按 userId 查询会话列表」外，所有接口均需 Privy JWT 认证。** user_id 由服务端从 Token 中解析，前端不需要也不能传 user_id。
>
> **新建对话**：前端自行生成一个 UUID 作为 `session_id`，直接调用 stream 接口或 POST /messages 即可，无需提前创建会话。

---

**认证头**:
```http
Authorization: Bearer <privy_jwt_token>
```

**错误响应（认证/鉴权失败）**:

| 状态码 | 原因 |
|--------|------|
| 401 | 未携带 Token，或 Token 无效/已过期 |
| 403 | Token 有效，但该资源不属于当前用户 |

---

**ChatbotMessage 字段说明**（消息对象，多个接口复用）:

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 消息 ID（自增整数） |
| user_id | string | 用户 Privy ID（如 `did:privy:xxx`） |
| session_id | string | 会话 ID（前端生成的 UUID） |
| question | string | 用户提问（纯文字，向后兼容） |
| answer | string | AI 回复（纯文字，向后兼容） |
| question_verbose | object \| null | 结构化问题，含 context（如当前页面路径、chainId 等）；纯文字对话为 null |
| answer_verbose | array \| null | 完整 SSE 事件数组，供前端历史回放；纯文字对话为 null |
| tools | string[] \| null | 本次对话触发的 tool 名列表（如 `["create_trade_intent"]`）；无 tool 调用为 null |
| client_actions | string[] \| null | 本次对话触发的 client action type 列表（如 `["OPEN_TRADE_WINDOW"]`）；无 action 为 null |
| created_at | number | 创建时间（Unix 毫秒时间戳） |
| updated_at | number | 更新时间（Unix 毫秒时间戳） |

**ChatbotSession 字段说明**（会话摘要对象，多个接口复用）:

| 字段 | 类型 | 说明 |
|------|------|------|
| session_id | string | 会话 ID |
| user_id | string | 用户 Privy ID |
| message_count | number | 该会话下的消息数量 |
| last_message_at | number | 最后一条消息时间（Unix 毫秒时间戳） |
| first_question | string | 会话第一条问题（用于列表预览） |

---

### 会话接口

#### 1. 获取我的会话列表

**接口地址**: `GET /ai-api/chats/sessions`

**认证**: 需要 JWT（返回当前登录用户的所有会话）

**请求示例**:
```http
GET /ai-api/chats/sessions
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "session_id": "a1b2c3d4-0001-0001-0001-000000000001",
      "user_id": "did:privy:cmm0d4w0t00jd0cju28qvovul",
      "message_count": 2,
      "last_message_at": 1772260494135,
      "first_question": "现在 BTC 值得买吗？"
    }
  ],
  "meta": { "count": 3 }
}
```

> 列表按 `last_message_at DESC` 排序（最近活跃的会话排在最前）。

---

#### 2. 获取单个会话详情

**接口地址**: `GET /ai-api/chats/sessions/:sessionId`

**认证**: 需要 JWT，且该会话必须属于当前用户（否则返回 403）

**请求示例**:
```http
GET /ai-api/chats/sessions/a1b2c3d4-0001-0001-0001-000000000001
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "session_id": "a1b2c3d4-0001-0001-0001-000000000001",
    "user_id": "did:privy:cmm0d4w0t00jd0cju28qvovul",
    "message_count": 2,
    "last_message_at": 1772260494135,
    "first_question": "现在 BTC 值得买吗？"
  }
}
```

**错误响应**:

| 状态码 | 原因 |
|--------|------|
| 403 | 会话存在但不属于当前用户 |
| 404 | 会话不存在 |

---

#### 3. 删除整个会话

**接口地址**: `DELETE /ai-api/chats/sessions/:sessionId`

**认证**: 需要 JWT，且该会话必须属于当前用户

**说明**: 删除会话后，该会话下的所有消息也会一并删除（级联删除）。

**请求示例**:
```http
DELETE /ai-api/chats/sessions/a1b2c3d4-0001-0001-0001-000000000001
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": { "message": "Session deleted successfully" }
}
```

**错误响应**:

| 状态码 | 原因 |
|--------|------|
| 403 | 会话存在但不属于当前用户 |
| 404 | 会话不存在 |

---

#### 4. 流式 AI 对话（SSE）

**接口地址**: `POST /ai-api/chats/sessions/:sessionId/stream`

**认证**: 需要 JWT

**说明**:
- `sessionId` 由前端生成（UUID），新对话时生成新的，历史对话时复用已有的
- 当前返回 mock 流式数据，后续接入真实 AI Agent 后前端代码**零改动**
- 响应类型为 `text/event-stream`（SSE）
- 服务端根据 `message` 内容自动识别场景：
  - 含 `swap` / `兑换` / `交换` → **swap 场景**：文字流 → tool_call → 文字流
  - 含 `deposit` / `充值` / `入金` → **deposit 场景**：文字流 → tool_call → 文字流
  - 其他 → **纯文字场景**

**请求 Body**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| message | string | 是 | 用户输入的问题 |
| context | object | 建议必填 | 前端当前状态，AI 据此感知用户所处场景，会完整写入 AI System Prompt |
| context.pathname | string | 建议必填 | 用户当前所在页面路径，如 `/trade/BTC-USD`、`/portfolio`，AI 可据此推断意图 |
| context.walletAddress | string | 否 | 当前连接的钱包地址（工具调用余额/持仓时需要） |
| context.network | string | 否 | 当前选中的网络 |
| context.tokenSymbol | string | 否 | 当前页面的代币标的 |

> `context` 是自由 JSON 对象，字段不受限制，前端想让 AI 感知到的任何状态都可以放进去。`pathname` 是目前唯一确定必传的字段，其余字段待前后端对齐后补充。

**请求示例**:
```http
POST /ai-api/chats/sessions/a1b2c3d4-0001-0001-0001-000000000001/stream
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "message": "现在 BTC 值得买吗？",
  "context": {
    "pathname": "/home"
  }
}
```

**响应**（`Content-Type: text/event-stream`）

**场景 1：纯文字**（message 不含 swap/deposit 关键词）:
```
data: {"type":"session_start","data":{"model":"mock"},"ts":1772260494135}

data: {"type":"llm_token","data":{"content":"我已经"},"ts":1772260494165}
data: {"type":"llm_token","data":{"content":"收到你"},"ts":1772260494195}
data: {"type":"llm_token","data":{"content":"的信息"},"ts":1772260494225}
...

data: {"type":"session_end","data":{},"ts":1772260494415}
```

**场景 2：swap**（message 含 swap / 兑换 / 交换）:
```
data: {"type":"session_start","data":{"model":"mock"},"ts":1772260494135}

data: {"type":"llm_token","data":{"content":"好的，"},"ts":1772260494165}
data: {"type":"llm_token","data":{"content":"我来帮你"},"ts":1772260494195}
data: {"type":"llm_token","data":{"content":"创建兑换"},"ts":1772260494225}
data: {"type":"llm_token","data":{"content":"请求，"},"ts":1772260494255}
data: {"type":"llm_token","data":{"content":"稍等一下。"},"ts":1772260494285}

data: {"type":"tool_call_start","data":{"tool":"create_trade_intent","callId":"call_1772260494310_ab3xy","args":{"from_token_symbol":"ETH","to_token_symbol":"SOL","trade_type":"spot","from_amount":"0.1","from_amount_usd":"350.00"}},"ts":1772260494310}

data: {"type":"tool_call_complete","data":{"tool":"create_trade_intent","callId":"call_1772260494310_ab3xy","duration":400,"result":{"status":"success","data":{"message":"已准备好 ETH → SOL 的兑换","client_action":{"type":"OPEN_TRADE_WINDOW","params":{"from_token_symbol":"ETH","to_token_symbol":"SOL","trade_type":"spot","from_amount":"0.1","from_amount_usd":"350.00"}}}}},"ts":1772260494410}

data: {"type":"llm_token","data":{"content":"交易窗口"},"ts":1772260494440}
data: {"type":"llm_token","data":{"content":"已为你"},"ts":1772260494470}
data: {"type":"llm_token","data":{"content":"打开，"},"ts":1772260494500}
data: {"type":"llm_token","data":{"content":"请确认"},"ts":1772260494530}
data: {"type":"llm_token","data":{"content":"参数后提交。"},"ts":1772260494560}

data: {"type":"session_end","data":{},"ts":1772260494590}
```

**场景 3：deposit**（message 含 deposit / 充值 / 入金）:
```
data: {"type":"session_start","data":{"model":"mock"},"ts":1772260494135}

data: {"type":"llm_token","data":{"content":"检测到"},"ts":1772260494165}
...

data: {"type":"tool_call_start","data":{"tool":"show_deposit_prompt","callId":"call_1772260494310_cd5zw","args":{"network":"arb"}},"ts":1772260494310}

data: {"type":"tool_call_complete","data":{"tool":"show_deposit_prompt","callId":"call_1772260494310_cd5zw","duration":400,"result":{"status":"success","data":{"message":"请先充值 USDC","client_action":{"type":"SHOW_DEPOSIT_PROMPT","params":{"network":"arb","address":"0x6da2ddd35367c323a5cb45ea0ecdb8d243445db4","redirectUrl":"https://buy.onramper.com"}}}}},"ts":1772260494710}

data: {"type":"llm_token","data":{"content":"充值完成"},"ts":1772260494740}
...

data: {"type":"session_end","data":{},"ts":1772260494820}
```

> 每个 `llm_token` 事件携带 1-3 个字的词片段，每隔约 40ms 推送一次。

**SSE 事件类型**:

| type | 触发场景 | 说明 |
|------|----------|------|
| `session_start` | 所有场景 | 对话开始，`data.model` 当前为 `"mock"`；前端可显示 loading |
| `llm_token` | 所有场景 | 词片段（1-3字），`data.content` 为内容，前端逐词拼接渲染 |
| `tool_call_start` | swap / deposit | tool 调用开始；`data.tool` 为工具名，`data.callId` 为本次调用 ID，`data.args` 为调用参数 |
| `tool_call_complete` | swap / deposit | tool 调用完成；`data.result.data.client_action` 包含前端应执行的动作（`type` + `params`） |
| `session_end` | 所有场景 | 对话结束，前端关闭连接并调用 POST /messages 落库 |

**client_action type 枚举**:

| type | 触发时机 | params 字段 |
|------|----------|-------------|
| `OPEN_TRADE_WINDOW` | swap 场景 tool 调用成功后 | `from_token_symbol`, `to_token_symbol`, `trade_type`, `from_amount`, `from_amount_usd` |
| `SHOW_DEPOSIT_PROMPT` | deposit 场景 tool 调用成功后 | `network`, `address`, `redirectUrl` |

**前端消费示例**:
```javascript
// 新建对话时前端生成 sessionId
const sessionId = crypto.randomUUID()

const res = await fetch(`/ai-api/chats/sessions/${sessionId}/stream`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ message: '我想兑换 ETH' }),
})

let fullAnswer = ''
const reader = res.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  const chunk = decoder.decode(value, { stream: true })
  for (const line of chunk.split('\n')) {
    if (!line.startsWith('data: ')) continue
    const event = JSON.parse(line.slice(6))
    if (event.type === 'llm_token') {
      fullAnswer += event.data.content
      // 实时渲染
    }
    if (event.type === 'tool_call_complete') {
      const clientAction = event.data.result?.data?.client_action
      if (clientAction?.type === 'OPEN_TRADE_WINDOW') {
        // 打开交易窗口，传入 clientAction.params
      }
      if (clientAction?.type === 'SHOW_DEPOSIT_PROMPT') {
        // 显示充值引导，传入 clientAction.params
      }
    }
    if (event.type === 'session_end') {
      // 对话结束，调用 POST /messages 落库（可附带 answer_verbose、tools、client_actions）
    }
  }
}
```

---

#### 5. 测试用：按 userId 查询会话列表（无鉴权）

**接口地址**: `GET /ai-api/chats/sessions/by-user/:userId`

**认证**: 无需认证（仅供后台/测试用）

**请求示例**:
```http
GET /ai-api/chats/sessions/by-user/did:privy:cmm0d4w0t00jd0cju28qvovul
```

**响应示例**: 与「1. 获取我的会话列表」相同。

---

### 消息接口

#### 6. 获取会话的所有消息

**接口地址**: `GET /ai-api/chats/messages?sessionId=xxx`

**认证**: 需要 JWT，且该会话必须属于当前用户（会话不存在或不属于当前用户均返回 404）

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| sessionId | string | 是 | 会话 ID |

**请求示例**:
```http
GET /ai-api/chats/messages?sessionId=a1b2c3d4-0001-0001-0001-000000000001
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "user_id": "did:privy:cmm0d4w0t00jd0cju28qvovul",
      "session_id": "a1b2c3d4-0001-0001-0001-000000000001",
      "question": "现在 BTC 值得买吗？",
      "answer": "从当前链上数据和市场情绪来看，BTC 短期波动较大，建议分批建仓。",
      "question_verbose": null,
      "answer_verbose": null,
      "tools": null,
      "client_actions": null,
      "created_at": 1772260200000,
      "updated_at": 1772260200000
    },
    {
      "id": 3,
      "user_id": "did:privy:cmm0d4w0t00jd0cju28qvovul",
      "session_id": "a1b2c3d4-0003-0003-0003-000000000003",
      "question": "我想用 100 USDC 换 ETH",
      "answer": "好的，我来帮你创建兑换请求，稍等一下。交易窗口已为你打开，请确认参数后提交。",
      "question_verbose": { "message": "我想用 100 USDC 换 ETH", "context": { "path": "/trade", "chainId": 1 } },
      "answer_verbose": [
        { "type": "session_start", "data": { "model": "mock" }, "ts": 1772260494135 },
        { "type": "llm_token", "data": { "content": "好的，" }, "ts": 1772260494165 },
        { "type": "tool_call_start", "data": { "tool": "create_trade_intent", "callId": "call_xxx", "args": {} }, "ts": 1772260494310 },
        { "type": "tool_call_complete", "data": { "tool": "create_trade_intent", "callId": "call_xxx", "duration": 400, "result": { "status": "success", "data": { "client_action": { "type": "OPEN_TRADE_WINDOW", "params": {} } } } }, "ts": 1772260494410 },
        { "type": "session_end", "data": {}, "ts": 1772260494590 }
      ],
      "tools": ["create_trade_intent"],
      "client_actions": ["OPEN_TRADE_WINDOW"],
      "created_at": 1772260400000,
      "updated_at": 1772260400000
    }
  ],
  "meta": { "count": 2 }
}
```

> 消息按 `created_at ASC` 排序（最早的排在最前）。

**错误响应**:

| 状态码 | 原因 |
|--------|------|
| 400 | 缺少 sessionId 参数 |
| 404 | 会话不存在，或该会话不属于当前用户 |

---

#### 7. 保存一条消息

**接口地址**: `POST /ai-api/chats/messages`

**认证**: 需要 JWT（`user_id` 由服务端从 Token 注入，body 不需要也不能传 `user_id`）

**说明**: AI 流式对话结束后，前端将完整的问答落库。建议同时传入 verbose 字段和 tools/client_actions，供历史回放和行为分析使用。

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| session_id | string | 是 | 会话 ID（与 stream 接口一致） |
| question | string | 是 | 用户的提问（纯文字） |
| answer | string | 是 | AI 完整回复（流式结束后拼接的纯文字） |
| question_verbose | object | 否 | 结构化问题，含 context（如 `{"message":"...","context":{"path":"/trade"}}`） |
| answer_verbose | array | 否 | 完整 SSE 事件数组（前端按收到顺序收集所有 event 对象） |
| tools | string[] | 否 | 触发的 tool 名列表（从 `tool_call_complete` 事件中收集 `data.tool`） |
| client_actions | string[] | 否 | 触发的 client action type 列表（从 `tool_call_complete.result.data.client_action.type` 收集） |

**请求示例（纯文字场景）**:
```http
POST /ai-api/chats/messages
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "session_id": "a1b2c3d4-0001-0001-0001-000000000001",
  "question": "现在 BTC 值得买吗？",
  "answer": "从当前链上数据和市场情绪来看，BTC 短期波动较大，建议分批建仓而非一次性重仓。"
}
```

**请求示例（swap 场景，带 verbose 字段）**:
```json
{
  "session_id": "a1b2c3d4-0003-0003-0003-000000000003",
  "question": "我想用 100 USDC 换 ETH",
  "answer": "好的，我来帮你创建兑换请求，稍等一下。交易窗口已为你打开，请确认参数后提交。",
  "question_verbose": {
    "message": "我想用 100 USDC 换 ETH",
    "context": { "path": "/trade", "chainId": 1 }
  },
  "answer_verbose": [
    { "type": "session_start", "data": { "model": "mock" }, "ts": 1772260494135 },
    { "type": "llm_token", "data": { "content": "好的，" }, "ts": 1772260494165 },
    { "type": "tool_call_start", "data": { "tool": "create_trade_intent", "callId": "call_xxx", "args": {} }, "ts": 1772260494310 },
    { "type": "tool_call_complete", "data": { "tool": "create_trade_intent", "callId": "call_xxx", "duration": 400, "result": { "status": "success", "data": { "client_action": { "type": "OPEN_TRADE_WINDOW", "params": {} } } } }, "ts": 1772260494410 },
    { "type": "session_end", "data": {}, "ts": 1772260494590 }
  ],
  "tools": ["create_trade_intent"],
  "client_actions": ["OPEN_TRADE_WINDOW"]
}
```

**响应示例** (HTTP 201):
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "user_id": "did:privy:cmm0d4w0t00jd0cju28qvovul",
    "session_id": "a1b2c3d4-0001-0001-0001-000000000001",
    "question": "现在 BTC 值得买吗？",
    "answer": "从当前链上数据和市场情绪来看，BTC 短期波动较大，建议分批建仓而非一次性重仓。",
    "question_verbose": null,
    "answer_verbose": null,
    "tools": null,
    "client_actions": null,
    "created_at": 1772260200000,
    "updated_at": 1772260200000
  }
}
```

**错误响应**:

| 状态码 | 原因 |
|--------|------|
| 400 | 缺少 session_id / question / answer |

---

#### 8. 更新消息

**接口地址**: `PATCH /ai-api/chats/messages/:id`

**认证**: 需要 JWT，且该消息必须属于当前用户

**请求参数**（至少传一个）:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| question | string | 否 | 更新后的提问（纯文字） |
| answer | string | 否 | 更新后的回复（纯文字） |
| question_verbose | object \| null | 否 | 更新结构化问题 |
| answer_verbose | array \| null | 否 | 更新完整 SSE 事件数组 |
| tools | string[] \| null | 否 | 更新触发的 tool 名列表 |
| client_actions | string[] \| null | 否 | 更新触发的 client action type 列表 |

**请求示例**:
```http
PATCH /ai-api/chats/messages/1
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "answer": "更新后的回复内容"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "user_id": "did:privy:cmm0d4w0t00jd0cju28qvovul",
    "session_id": "a1b2c3d4-0001-0001-0001-000000000001",
    "question": "现在 BTC 值得买吗？",
    "answer": "更新后的回复内容",
    "question_verbose": null,
    "answer_verbose": null,
    "tools": null,
    "client_actions": null,
    "created_at": 1772260200000,
    "updated_at": 1772260800000
  }
}
```

**错误响应**:

| 状态码 | 原因 |
|--------|------|
| 404 | 消息不存在，或该消息不属于当前用户 |

---

#### 9. 删除单条消息

**接口地址**: `DELETE /ai-api/chats/messages/:id`

**认证**: 需要 JWT，且该消息必须属于当前用户

**请求示例**:
```http
DELETE /ai-api/chats/messages/1
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": { "message": "Message deleted successfully" }
}
```

**错误响应**:

| 状态码 | 原因 |
|--------|------|
| 404 | 消息不存在，或该消息不属于当前用户 |

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
