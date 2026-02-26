# RunPod 部署运维手册

## 环境信息

| 项目 | 值 |
|------|------|
| Pod IP | `216.249.100.66` |
| SSH 端口 | `13654` |
| 服务端口（外部） | `13658` |
| 服务端口（内部） | `10000` |
| 服务地址 | `http://216.249.100.66:13658` |
| 健康检查 | `http://216.249.100.66:13658/health` |
| 代码目录 | `/workspace/node/neo-database-server` |
| Node 环境 | `/workspace/.nvm` |

## SSH 连接

```bash
ssh root@216.249.100.66 -p 13654 -i ~/.ssh/id_ed25519
```

## 每次 SSH 进入后必须先执行

RunPod 容器的 nvm 不在系统 PATH 里，每次新开终端都需要手动加载：

```bash
export NVM_DIR="/workspace/.nvm"
source "$NVM_DIR/nvm.sh"
```

建议把这两行加到 `~/.bashrc` 末尾，这样自动生效：

```bash
echo 'export NVM_DIR="/workspace/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
```

---

## 自动部署（GitHub Actions）

**每次 push 到 main 分支，RunPod 上的服务会自动更新**，无需手动操作。

```
git push origin main
  → GitHub Actions 触发
  → SSH 进入 RunPod
  → git pull + pnpm install + pnpm build + pm2 restart
```

可以在 GitHub 仓库 → **Actions** 标签页查看每次部署的执行结果。

> workflow 文件：`.github/workflows/deploy.yml`
> 所需 GitHub Secrets：`RUNPOD_HOST`、`RUNPOD_PORT`、`RUNPOD_USER`、`RUNPOD_SSH_KEY`

---

## 手动操作（备用）

### 更新代码并重启服务

SSH 进入后执行：

```bash
export NVM_DIR="/workspace/.nvm" && source "$NVM_DIR/nvm.sh"

cd /workspace/node/neo-database-server
git pull origin main
pnpm install --frozen-lockfile
pnpm build
pm2 restart neo-database-server
```

### 查看服务状态

```bash
pm2 status
```

### 查看实时日志

```bash
pm2 logs neo-database-server
```

### 查看最近 50 行日志

```bash
pm2 logs neo-database-server --lines 50
```

### 手动启动服务（服务不存在时）

```bash
cd /workspace/node/neo-database-server
pnpm build
PORT=10000 pm2 start packages/server/dist/main.js --name neo-database-server
pm2 save
```

---

## 端口映射说明

RunPod 把容器内端口映射到外部 IP，**不能随意换端口**，只能用以下已分配的映射：

| 外部访问 | 容器内端口 |
|----------|-----------|
| `216.249.100.66:13654` | `:22` (SSH) |
| `216.249.100.66:13655` | `:80` (nginx 占用，有 502) |
| `216.249.100.66:13656` | `:6379` |
| `216.249.100.66:13657` | `:9000` |
| `216.249.100.66:13658` | `:10000` ← **我们用这个** |
| `216.249.100.66:13659` | `:11000` |

> 注意：`:80` 虽然有映射，但 nginx 在转发时会报 502，不要用。

---

## 常见问题排查

### `pm2: command not found`

没有加载 nvm 环境，执行：

```bash
export NVM_DIR="/workspace/.nvm" && source "$NVM_DIR/nvm.sh"
```

### `No space left on device`

容器根目录（`/`）只有 30G，容易被缓存塞满。检查空间：

```bash
df -h /
```

清理 pip 缓存（最大头）：

```bash
find /root/.cache/pip -type f -delete
find /tmp -type f -delete
```

> 注意：`/workspace` 有 100G 空间，所有代码和 nvm 都放在这里。

### 服务启动后外网访问 502

确认服务跑在 `10000` 端口：

```bash
pm2 env neo-database-server | grep PORT
# 或者
curl http://localhost:10000/health
```

如果本地能通但外网 502，检查 pm2 是否真的在跑：

```bash
pm2 status
```

### 服务挂了自动重启

pm2 本身会自动重启崩溃的进程。如果整个 Pod 重启了，需要手动恢复（RunPod 不保证持久化 pm2 进程）：

```bash
export NVM_DIR="/workspace/.nvm" && source "$NVM_DIR/nvm.sh"
pm2 resurrect  # 从之前 pm2 save 的状态恢复
```

如果 resurrect 失败，手动重新启动：

```bash
cd /workspace/node/neo-database-server
PORT=10000 pm2 start packages/server/dist/main.js --name neo-database-server
pm2 save
```
