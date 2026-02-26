# neo-database-server

MyDex 数据库服务，提供内容、用户、聊天三张表的 RESTful CRUD 接口。

**生产地址**: `http://216.249.100.66:13658`

---

## 架构

pnpm monorepo，两个包：

```
packages/
├── database/   @mydex/database        — 数据访问层（pg 直连，Repository 模式）
└── server/     @mydex/database-server — Express 5 API 服务
```

数据库：PostgreSQL on AWS RDS，三张表：

| 表 | 用途 |
|----|------|
| `ai_raw_content` | 原始内容（news/edu/social） |
| `ai_processed_content` | AI 处理后内容（摘要、分类、推荐代币等） |
| `ai_user_profiles` | 用户画像（风险偏好、决策速度等） |
| `ai_chat` | 聊天记录 |

---

## 快速开始

```bash
pnpm install
pnpm dev          # 启动开发服务器，监听 :3000
```

> **注意**：修改 `packages/database/` 下的代码后，需要先 `pnpm build` 重新编译，再重启 dev server，改动才会生效（database 包以编译产物 `dist/` 被 server 引用）。

---

## 常用命令

```bash
pnpm dev          # 启动开发服务器（tsx watch）
pnpm build        # 编译所有包（tsc）
pnpm start        # 生产模式启动

pnpm migrate      # 执行 SQL 迁移（packages/database/db/migrations/）
pnpm seed         # 导入种子数据

# 单包操作
pnpm --filter @mydex/database build
pnpm --filter @mydex/database-server dev
```

---

## 测试

```bash
cd test && pnpm test
```

测试脚本会依次调用所有接口并打印结果，需要本地 dev server 处于运行状态。

---

## API 文档

详见 **[API.md](./API.md)**，包含所有接口的请求参数、响应格式和错误码说明。

---

## 部署

详见 **[README_RUNPOD.md](./README_RUNPOD.md)**，包含 RunPod 服务信息、SSH 连接、pm2 进程管理和自动部署说明。

push 到 `main` 分支后 GitHub Actions 会自动部署。

---

## 关键设计

**错误处理分三层**（`packages/server/src/middleware/error.ts`）：
- 业务校验错误（`ApiError`）：主动抛出，`message` 为英文描述，部分附带 `details`
- PostgreSQL 错误：按 pg error code 映射为友好 message，HTTP 400
- JS 运行时错误：统一返回 `Internal server error`，不暴露细节

**开发工作流**：修改代码 → `cd test && pnpm test` 验证 → 更新 `API.md` → commit & push
