# API 测试

测试 @mydex/database-server 的所有 API 端点。

## 运行测试

### 方式一：TypeScript 测试（推荐）

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm test
```

### 方式二：curl 测试

```bash
# 运行 bash 测试脚本
pnpm test:curl
```

## 测试覆盖

### ✅ 已测试

| 端点 | 方法 | 状态 |
|------|------|------|
| `/health` | GET | ✅ |
| `/api/contents/processed` | GET | ✅ |
| `/api/contents/processed/:id` | GET | ✅ |
| `/api/contents/category/:category` | GET | ✅ |
| `/api/contents/risk/:riskLevel` | GET | ✅ |
| `/api/users` | POST | ✅ |
| `/api/users/:userId` | GET | ✅ |
| `/api/users/:userId/traits` | PATCH | ✅ |

### ⚠️ 需要修复

| 端点 | 问题 |
|------|------|
| `/api/chats` | POST 返回 500 |
| `/api/chats/user/:userId` | GET 返回 500 |

## 测试数据

测试会创建以下数据：
- 测试用户（ID: `test_user_<timestamp>`）
- 测试聊天记录

这些数据会保留在数据库中，可以手动删除。
