# XHS

小红书移动端项目，使用 [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) 重构的 Bun workspace。客户端为 Expo 57 / React Native 0.86，服务端为 Hono + Cloudflare Workers，统一使用 Turborepo、TanStack Query、oRPC、better-auth、Cloudflare D1/R2 与 Biome。

## 项目结构

```text
apps/
  native/          Expo Router 客户端（iOS / Android / Expo Web）
  server/          Hono 服务端（Cloudflare Workers，绑定 D1 / R2）
packages/
  config/          共享严格 TypeScript 配置
  env/             Native / Server 类型安全环境变量
  rpc/             共享 oRPC 契约（Zod 输入输出）
docs/
  specs/           API 契约需求、规格、计划与评审
.agents/skills/    Codex 专项流程（native-data-fetch）
```

## 开始开发

```bash
bun install
bun run dev:native   # Expo 开发服务器
bun run dev:server   # wrangler dev --port 3000
```

也可以 `bun run dev` 同时启动两端。

原生端默认连接：

- iOS 模拟器与 Web：`http://localhost:3000`
- Android 模拟器：`http://10.0.2.2:3000`
- 真机：在 `apps/native/.env` 配置可访问的 `EXPO_PUBLIC_SERVER_URL`

环境变量示例见 `apps/native/.env.example`、`apps/server/.env.example` 与 `apps/server/.dev.vars.example`。

## 常用命令

```bash
bun run dev            # 同时启动 native + server
bun run dev:native
bun run dev:server
bun run check-types
bun run check          # biome check --write .
```

- 目前没有任何 workspace 定义 `build` 脚本，根目录 `bun run build` 是空操作。
- Server 生成 Node/Lambda 产物（已不再接线到脚本）可在 `apps/server` 执行 `bunx tsdown` 与 `bunx tsdown --config tsdown.lambda.config.ts`。
- Server 内执行 D1 迁移：`bun run d1:migrate:local`、`bun run d1:migrate:remote`；部署：`bun run deploy`。

## 服务端

- `/`：健康检查文本
- `/rpc/*`：oRPC 共享契约（`packages/rpc`），Native 通过 `apps/native/lib/orpc.ts` 调用
- `/api/auth/*`：better-auth 邮箱密码登录（含 Expo 插件），Kysely + D1 持久化，迁移在 `apps/server/migrations`
- CORS 默认允许 localhost、loopback 与私网开发来源，可用 `CORS_ORIGIN` / `CORS_ORIGINS` 配置

## Cloudflare（Alchemy / Wrangler）

根目录 `alchemy.run.ts` 与 `apps/server/wrangler.jsonc` 声明同一批资源：D1 `xhs-d1`、R2 `xhs-images`、Worker `xhs-server`。两套工具任选其一部署，不要混用。

```bash
bun run alchemy:dev       # 本地 workerd + 本地 D1/R2 模拟
bun run alchemy:plan      # 预览部署 diff
bun run alchemy:deploy    # 正式部署
bun run alchemy:adopt     # 首次接管 wrangler 已创建的资源
bun run alchemy:destroy   # 销毁栈内资源
```

Alchemy 默认从 `apps/server/.env` 读取配置，首次运行会引导 Cloudflare OAuth（凭据在 `~/.alchemy/profiles.json`）；Wrangler 本地开发读取 `apps/server/.dev.vars`。

## 认证与会话

- Native 使用 better-auth Expo 客户端，令牌存 SecureStore（Web 为 localStorage），统一由 `apps/native/lib/auth-client.ts` 管理
- 未登录时可游客进入，`AuthGate` 统一守卫；设置页可退出并清理本地令牌
- 匿名会话用 SecureStore 持久化 UUID，存储不可用时回退内存

## 环境变量

Server（`packages/env/src/server.ts`）：`BETTER_AUTH_SECRET`（至少 32 字符）、`BETTER_AUTH_URL`、`CORS_ORIGIN`、`CORS_ORIGINS`、`NODE_ENV`、`PORT`

Native（`packages/env/src/native.ts`）：`EXPO_PUBLIC_SERVER_URL`（可选，默认 localhost / 10.0.2.2）

Better-T-Stack 可复现配置保存在 `bts.jsonc`；当前 API 契约（oRPC、统一超时与取消）的需求和评审记录见 `docs/specs/api-contract`。
