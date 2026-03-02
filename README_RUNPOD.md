# RunPod 部署说明

## 服务信息

| 项目 | 值 |
|------|------|
| 服务地址 | `http://216.249.100.66:13658` |
| 健康检查 | `http://216.249.100.66:13658/health` |
| 代码目录 | `/workspace/node/neo-database-server` |

## SSH 连接

```bash
ssh root@216.249.100.66 -p 13654 -i ~/.ssh/id_ed25519
```

SSH 进入后需要先加载 Node 环境：

```bash
export NVM_DIR="/workspace/.nvm" && source "$NVM_DIR/nvm.sh"
```

## 进程管理（pm2）

服务由 pm2 管理，进程名为 `neo-database-server`，运行在容器内 `10000` 端口（对外 `13658`）。

```bash
pm2 status                              # 查看所有进程状态
pm2 logs neo-database-server            # 查看日志
pm2 restart neo-database-server --update-env  # 普通重启（不改启动参数时用）
```

### 手动完整重启（改过启动参数或 .env 丢失时用）

> ⚠️ `pm2 restart` 沿用旧的启动配置，改了参数必须先 delete 再重新 start。

```bash
export NVM_DIR="/workspace/.nvm" && source "$NVM_DIR/nvm.sh"
cd /workspace/node/neo-database-server
pm2 delete neo-database-server
PORT=10000 pm2 start packages/server/dist/main.js \
  --name neo-database-server \
  --node-args="--env-file=/workspace/node/neo-database-server/.env"
pm2 save
```

### .env 文件

路径：`/workspace/node/neo-database-server/.env`

> ⚠️ `.env` 不在 git 里，手动操作或 CI 异常时可能丢失，丢失后服务会因找不到数据库配置而崩溃。

```
NODE_ENV=production
PORT=10000
PRIVY_APP_ID=cmlubuldi02gs0blamh0qewit
DB_HOST=mydex-test.c16k8amcamtg.ap-northeast-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=（见内部文档）
DB_NAME=mydex_v1
```

重建命令：

```bash
cat > /workspace/node/neo-database-server/.env << 'EOF'
NODE_ENV=production
PORT=10000
PRIVY_APP_ID=cmlubuldi02gs0blamh0qewit
DB_HOST=mydex-test.c16k8amcamtg.ap-northeast-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=（填入真实密码）
DB_NAME=mydex_v1
EOF
```

### ⚠️ 已知踩坑

| 问题 | 原因 | 解决 |
|------|------|------|
| `node: .env: not found` | `--env-file` 用了相对路径，pm2 重启时 cwd 不固定 | 必须用绝对路径 `--env-file=/workspace/node/.../.env` |
| 服务 online 但外部 curl 连不上 | 服务监听的是 3000，但 RunPod 对外映射的是内部 10000 | 启动时必须加 `PORT=10000` |
| CI 部署后服务崩溃（↺ 58 次） | `package.json` 里 `start` 脚本写的是 `dist/index.js`，实际入口是 `dist/main.js` | 已修复，入口为 `packages/server/dist/main.js` |
| `git pull` 被 abort | RunPod 上 `.env` 有修改与 git 冲突 | CI 在 pull 前备份 `.env`，pull 后恢复 |

## 自动部署

已通过 GitHub Actions 配置自动部署，**每次 push 到 main 分支后服务自动更新**，无需手动操作。

部署进度可在 GitHub 仓库 → **Actions** 标签页查看。

---

## 迁移到新仓库 / 新服务

如果需要把 `13658` 端口换给另一个服务使用，按以下步骤操作：

### 1. 停掉当前服务

SSH 进入 RunPod：

```bash
export NVM_DIR="/workspace/.nvm" && source "$NVM_DIR/nvm.sh"
pm2 delete neo-database-server
pm2 save
```

### 2. 在 RunPod 上部署新服务

```bash
cd /workspace/node
git clone <新仓库地址>
cd <新仓库目录>
pnpm install
pnpm build
PORT=10000 pm2 start <入口文件> --name <新进程名>
pm2 save
```

### 3. 在新仓库配置 GitHub Actions

复制本仓库的 `.github/workflows/deploy.yml`，修改其中的部署脚本路径和 pm2 进程名，然后在新仓库的 GitHub Secrets 里添加同样的 4 个变量：

| Secret | 值 |
|--------|------|
| `RUNPOD_HOST` | `216.249.100.66` |
| `RUNPOD_PORT` | `13654` |
| `RUNPOD_USER` | `root` |
| `RUNPOD_SSH_KEY` | SSH 私钥内容 |

### 端口占用情况

| 外部端口 | 内部端口 | 当前用途 |
|----------|---------|---------|
| `13654` | `:22` | SSH |
| `13655` | `:80` | nginx（502，不可用） |
| `13656` | `:6379` | 空闲 |
| `13657` | `:9000` | 空闲 |
| `13658` | `:10000` | **本服务** |
| `13659` | `:11000` | 空闲 |

如果要同时跑多个服务，可以把新服务部署到其他空闲端口（如 `13656` → 内部 `:6379`），不需要停掉本服务。
