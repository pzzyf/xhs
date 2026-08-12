# AGENTS.md

本仓库的 AI 代理工作约定。权威需求与阶段计划在 `docs/specs/v1-portfolio-app/`。

## 项目一句话

小红书风格内容社区 App（作品集向）：Expo（iOS/Android）+ Hono on Cloudflare Workers + D1 + R2 + better-auth + oRPC + Drizzle + Alchemy，Bun monorepo（Turbo）。

## 常用命令

- `bun install`：安装依赖（Bun 是唯一包管理器，不手改 lock）
- `bun run check-types`：全仓类型检查（Turbo 逐 workspace）
- `bun run check`：Biome 格式化 + Lint（scoped 修改文件时用 `bunx biome check <files>`）
- `bun run dev:server`：Alchemy 本地起 Worker + D1 + R2（默认 :3000）
- `bun run dev:native`：Expo 客户端（需 `apps/native/.env` 的 `EXPO_PUBLIC_SERVER_URL`）
- `bunx expo install --check`（在 `apps/native/`）：校验 Expo 依赖版本
- `bun run alchemy:plan|deploy`：Cloudflare 资源变更计划 / 部署

## 架构要点

- `apps/server/src/worker.ts` 是 Worker 唯一入口；Hono app 在 `src/app.ts`；服务端环境类型在 `src/types.ts`（`ServerEnv`，含 `DB`/`IMAGES` 绑定）
- 契约只写一处：`packages/api/src/contract.ts`（oRPC + Zod），Native/Server 共用
- Drizzle schema 在 `packages/db/src/schema.ts`；迁移 SQL 生成到 `packages/db/migrations`，由 Alchemy 应用
- better-auth 挂载在 `/api/auth/*`；oRPC 过程在 `/rpc/*`；R2 图片 `PUT /api/images` + `GET /images/:key`
- 客户端：Expo Router；TanStack Query（AppState focus / NetInfo online 已接线）；HeroUI + Uniwind + 主题 token 在 `providers/theme-provider.tsx`（主色青绿 `#16a085`，避免小红书商标红）
- 根布局 Provider 顺序：Query → Gesture → SafeArea → Keyboard → HeroUI → Toast → Theme → Router

## 硬性规则

- 不自动 commit / push / 部署；只有用户明确要求才执行
- 不引入 Kysely、评论、搜索、AI、Lambda、Wrangler 平行 IaC（需求 NG-\* 列表见 `docs/specs/v1-portfolio-app/requirements.md`）
- 密钥只放 `.env`（gitignore）；仅提交 `.env.example`；禁止密钥进 `EXPO_PUBLIC_*`
- 环境变量定义在 `packages/env`，用 Zod 校验
- 改服务端后至少 `alchemy dev` 冒烟；改客户端后 `bun run check-types`
- UI 文案仅中文

## 当前阶段

P0–P7 已完成并部署；v1.1.0：Web 静态产物与 API 同源托管于同一 Worker（`https://xhs-server.0624afe1.workers.dev`），16 张真实种子照片（Unsplash 授权）、体验账号 `demo@xhs.dev / demo123456`、Android APK 分发（GitHub Releases）已完成并线上复验。里程碑 tag：P0–P5 对应 `v0.1.0`–`v0.6.0`，v1.0.0 对应 P7，v1.1.0 对应本轮。⚠️ `alchemy dev` 后再 `alchemy deploy` 会触发 D1/R2 破坏性重建（详见 README 部署章节）。进度见 `docs/specs/v1-portfolio-app/workflow-state.md`。
