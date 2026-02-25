# @mydex/database

MyDex 数据库操作层 - 纯数据模块，可被任何项目引用。

## 功能

- ✅ 数据库连接管理 (PostgreSQL)
- ✅ Repository 模式 CRUD 操作
- ✅ TypeScript 类型定义
- ✅ 数据验证工具 (chain, address)
- ✅ 数据库迁移 (migrate)
- ✅ 假数据 (seed)

## 安装

```bash
pnpm add @mydex/database
```

## 使用

### 基本连接

```typescript
import { connect, disconnect, client } from '@mydex/database'

// 连接数据库
await connect()

// 使用 client 直接查询
const result = await client.query('SELECT * FROM ai_raw_content')

// 断开连接
await disconnect()
```

### Repository 操作

```typescript
import { contentRepo } from '@mydex/database'

// 创建内容
const content = await contentRepo.createProcessed({
  title: '测试内容',
  content_type: 'news',
  content: '这是测试内容',
  // ... 其他字段
})

// 查询内容
const found = await contentRepo.findProcessedById('content_xxx')

// 列表查询（带过滤）
const list = await contentRepo.findProcessed({
  category: 'tradable',
  risk_level: 'medium'
})
```

### 类型

```typescript
import type {
  ProcessedContent,
  SuggestedToken,
  ChainCode
} from '@mydex/database'

// 使用类型定义
const token: SuggestedToken = {
  symbol: 'ETH',
  name: 'Ethereum',
  chain: 'eth',
  addr: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  relevance_score: 0.9,
  sentiment: 'bullish',
  confidence: 0.8
}
```

### 验证工具

```typescript
import { isValidChain, isValidTokenAddress } from '@mydex/database'

// 验证链代号
isValidChain('eth')    // true
isValidChain('invalid') // false

// 验证代币地址
isValidTokenAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'eth') // true
isValidTokenAddress('invalid', 'eth') // false
```

## CLI

### 迁移

```bash
pnpm migrate
```

### 假数据

```bash
pnpm seed
```

## 依赖

- `pg` - PostgreSQL 客户端
- `@types/pg` - TypeScript 类型

## License

MIT
