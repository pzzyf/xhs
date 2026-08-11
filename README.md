# xhs

小红书风格内容社区 App（作品集向）—— Expo（iOS + Android）+ Hono on Cloudflare Workers + D1 + R2 + better-auth + oRPC + Drizzle + Alchemy。

> 权威需求与进度见 `docs/specs/v1-portfolio-app/`（requirements / spec / plan / workflow-state）。当前阶段：P0 骨架已就绪。

## 仓库结构

```text
apps/
  native/          Expo Router 客户端（iOS + Android + Web 演示）
  server/          Hono Worker（唯一入口 src/worker.ts）
packages/
  api/             oRPC contract + Zod（Native/Server 共用契约）
  auth/            better-auth 配置工厂
  db/              Drizzle schema / migrations / seed
  env/             native + server 环境变量校验（Zod）
  infra/           alchemy.run.ts：D1 + R2 + Worker 唯一真相源
  config/          共享 tsconfig
docs/specs/v1-portfolio-app/   需求 / 规格 / 计划 / 工作流状态
```

## 技术栈

- Bun workspaces + Turborepo + Biome + Lefthook
- 客户端：Expo SDK 57（Expo Router）+ HeroUI Native + Uniwind + TanStack Query
- 服务端：Hono on Cloudflare Workers，鉴权 better-auth（邮箱+密码）
- 存储：D1（Drizzle ORM）+ R2（笔记图片）
- 部署：Alchemy（唯一 IaC 声明）

## 本地开发

前置：Bun ≥ 1.3，Cloudflare 账号凭据（部署时才需要）。

```bash
bun install

# 服务端（Alchemy 本地 runtime，D1/R2 绑定 + Worker @ :3000）
cp apps/server/.env.example apps/server/.env   # 填入 BETTER_AUTH_SECRET 等
bun run dev:server
curl http://localhost:3000/                    # 健康检查

# 客户端（Expo）
cp apps/native/.env.example apps/native/.env   # EXPO_PUBLIC_SERVER_URL 指向服务端
bun run dev:native
```

## 常用命令

```bash
bun run check-types   # 全仓类型检查（Turbo）
bun run check         # Biome 格式化 + Lint
bunx expo install --check   #（apps/native）校验 Expo 依赖对齐
bun run alchemy:plan  # 查看 Cloudflare 资源变更计划
bun run alchemy:deploy # 部署 Worker + D1 + R2 到公网
```

## 部署

```bash
cp packages/infra/.env.example packages/infra/.env  # Cloudflare 凭据（不入库）
cp apps/server/.env.example apps/server/.env        # 线上 BETTER_AUTH_URL 等
bun run alchemy:plan && bun run alchemy:deploy
```

部署后把 `apps/native/.env` 的 `EXPO_PUBLIC_SERVER_URL` 指向公网地址。

## 安全与约定

- 真密钥只放各 `.env`（已 gitignore），仅提交 `.env.example`
- 禁止把密钥放进 `EXPO_PUBLIC_*`
- 提交由用户显式发起；不 force push；不绕过 Lefthook hooks
- 不引入 Kysely / 评论 / 搜索 / AI / 双轨 IaC（详见需求非目标）
