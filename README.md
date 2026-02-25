# MyDex Database Server

MyDex 数据库服务 Monorepo，包含数据库操作层和 API 服务。

## 结构

```
neo-database-server/
├── packages/
│   ├── database/         # @mydex/database - 数据库操作模块
│   └── server/           # @mydex/database-server - API 服务
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## 包说明

### @mydex/database

数据库操作层，提供：
- 数据库连接管理
- Repository (CRUD 操作)
- 类型定义 (TypeScript)
- 数据库迁移 (migrate)
- 假数据 (seed)
- 验证工具

**可被其他项目独立引用！**

### @mydex/database-server

Express API 服务，提供：
- RESTful API 接口
- 用户管理 API
- 内容管理 API
- 聊天记录 API
- 依赖 `@mydex/database`

## 安装

```bash
pnpm install
```

## 使用

### 开发

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:3000
```

### 数据库操作

```bash
# 运行迁移
pnpm migrate

# 导入假数据
pnpm seed
```

### 构建

```bash
# 构建所有包
pnpm build
```

## API 文档

详见 [API.md](./API.md)

## 开发

```bash
# 只安装 database 模块
cd packages/database
pnpm install

# 只安装 server 模块
cd packages/server
pnpm install
```
