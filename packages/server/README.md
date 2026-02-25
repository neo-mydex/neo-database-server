# @mydex/database-server

MyDex 数据库 API 服务 - Express REST API。

## 功能

- ✅ RESTful API 接口
- ✅ 用户管理 API
- ✅ 内容管理 API (news/edu/social)
- ✅ 聊天记录 API
- ✅ CORS 支持
- ✅ 统一错误处理
- ✅ 请求日志

## 依赖

- `@mydex/database` - 数据库操作层
- `express` - Web 框架
- `cors` - 跨域支持
- `morgan` - HTTP 日志

## 安装

```bash
pnpm install
```

## 开发

```bash
pnpm dev
```

服务运行在 http://localhost:3000

## API 端点

### 健康检查

```
GET /health
```

### 用户管理

```
GET    /api/users/:userId
POST   /api/users
PATCH  /api/users/:userId/traits
PATCH  /api/users/:userId/trade-count
DELETE /api/users/:userId
```

### 内容管理

```
GET    /api/contents/raw/:id
GET    /api/contents/processed/:id
GET    /api/contents/processed
GET    /api/contents/category/:category
GET    /api/contents/risk/:riskLevel
```

### 聊天记录

```
POST   /api/chats
GET    /api/chats/:id
GET    /api/chats/user/:userId
GET    /api/chats/session/:sessionId
GET    /api/chats/user/:userId/sessions
PATCH  /api/chats/:id
DELETE /api/chats/:id
DELETE /api/chats/session/:sessionId
```

详细文档见 [API.md](../../API.md)

## 环境变量

- `PORT` - 服务端口 (默认: 3000)
- `DATABASE_URL` - PostgreSQL 连接字符串

## License

MIT
