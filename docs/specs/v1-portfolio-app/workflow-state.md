# V1 作品集 App — 工作流状态（Workflow State）

> 更新规则：每阶段结束更新本文件；只有对应能力已实现并验证后才可划掉路线图条目。

## 当前状态

- **阶段**：P2（better-auth 注册登录登出 + Native 会话）—— **awaiting-human-review**
- **总体状态**：鉴权主链路已实现并通过 Web/HTTP 验证；待用户批准进入 P3
- **提交策略**：user-managed（用户明确指示才 commit）
- **权威需求**：`SUPERPOWER-BRIEF.md`（冻结）→ `requirements.md` / `spec.md`

## P2 收尾（2026-08-12）

已完成：

- `packages/auth`：better-auth 1.6.26 + Drizzle/D1 adapter + Expo 服务端插件，basePath `/api/auth`
- `apps/server/src/app.ts`：挂载 `GET/POST /api/auth/*`，补齐 Expo cookie 所需 CORS headers
- HTTP 冒烟：注册、get-session、退出、重新登录均返回 200；会话清除/恢复正确
- Native auth client：`@better-auth/expo/client` + SecureStore；scheme/storagePrefix 均为 `xhs`
- Native 会话：AuthProvider 暴露 user/session/refresh/signOut；根 Provider 顺序符合规格
- 登录/注册页：邮箱+密码、注册昵称、中文校验/错误态；成功固定回首页
- 首页/我的：未登录可浏览首页；发布与我的登录入口；已登录展示昵称/邮箱并可退出
- Android 模拟器默认 API 地址 `10.0.2.2:3000`；显式 `EXPO_PUBLIC_SERVER_URL` 优先
- Web 全流程：未登录首页 → 注册 → 我的 → 刷新保持登录 → 退出 → 再登录，浏览器控制台 0 error
- 验证：Bun 单元测试 6/6；`expo install --check` 通过；全仓类型与 scoped Biome 通过

环境事实：

- Web 验收因本机 8081 已占用，Expo worktree 临时使用 8082，并通过进程级 `CORS_ORIGINS` 显式放行；未扩大生产 trusted origins
- 独立 worktree 的 Alchemy 状态复用迁移记录但本地 SQLite 为空，验收时仅对 worktree D1 手动应用现有 `0000` 迁移；未修改主工作区数据

## P1 收尾（2026-08-12）

已完成：

- Drizzle schema（`packages/db/src/schema.ts`）：better-auth 核心表（user/session/account/verification，单数表名对齐 better-auth 默认）+ notes + likes（复合主键 noteId+userId）
- `drizzle-kit generate` → `packages/db/migrations/0000_wooden_guardian.sql`（Alchemy 原生支持 `--> statement-breakpoint`）
- `packages/db/src/index.ts`：`createDb(D1Database)` + Drizzle relations
- 种子（`packages/db/src/seed.ts`）：demo@xhs.dev「体验官小艾」+ 16 条中文笔记（标签 2–4 个，时间倒序错开 1h）
- 占位图（`packages/db/src/seed-images.ts`）：运行时生成 480×640 渐变 PNG（纯 TS + node:zlib，无外网图源）
- 种子接口（`apps/server/src/routes/seed.ts`）：`POST /api/dev/seed`，`x-seed-secret` 头匹配 `SEED_SECRET` 才生效；幂等
- 验证（本地 `alchemy dev`）：
  - `[DB] update (local)` 迁移应用成功，`d1_migrations` 记录 0000
  - `GET /` → 200 `{ ok: true }`
  - seed → `{"ok":true,"skipped":false,"users":1,"notes":16,"imagesUploaded":16}`；二次调用 skipped；错误密钥 401
  - sqlite 直查：user=1、notes=16、likes=0；R2 本地 16 个 blob
  - `bun run check-types` 6/6 全绿；scoped Biome 通过

环境事实：

- `apps/server/.env` 的 `SEED_SECRET` 已配置（gitignored）
- 本地 D1/R2 数据在 `.alchemy/local/`（gitignored）

## P0 收尾（2026-08-12）

已完成：

- 规格 scaffold：requirements.md / spec.md / plan/P0–P7.md / workflow-state.md
- 用户确认全删重来 → 删除旧 apps/*、packages/* 业务实现、旧 docs/specs、旧 AGENTS/readme（保留 .git）
- 重建骨架：packages/env、api、db、auth、infra；apps/server（Hono + 健康检查）；apps/native（Expo Router + Query/Theme/HeroUI）
- 根 `AGENTS.md`、`README.md` 已与 V1 一致
- 修复 `packages/infra/alchemy.run.ts`：`main` 相对仓库根 cwd 解析（`./apps/server/src/worker.ts`），否则 `alchemy dev` 只监听不响应
- 验证：
  - `bun run check-types`：6/6 全绿
  - `bunx biome check`：通过
  - `bun run dev:server` → `GET http://127.0.0.1:3000/` → `{"ok":true,"name":"xhs-server",...}`（需 `curl --noproxy '*'` 若本机有 HTTP 代理）

环境事实：

- `apps/server/.env` 已建（gitignored）
- `packages/infra/.env` 未建（部署时才需要）
- `packages/db/migrations` 目录已建（可为空，Alchemy dev 要求存在）

## 检查点记录

| 阶段 | 状态 | 日期 | 验收方式 | 结果 |
|------|------|------|----------|------|
| P0 | 完成（v0.1.0） | 2026-08-12 | `check-types` + Biome + `GET /` 健康检查 | 通过 |
| P1 | 完成（v0.2.0） | 2026-08-12 | alchemy dev 迁移 + 种子 + D1 直查 | 通过 |
| P2 | awaiting-human-review | 2026-08-12 | HTTP + Web 注册/登录/会话保持/登出 | 通过 |
| P3 | pending | — | 双列流 + 详情连真实 D1 | — |
| P4 | pending | — | 发布后列表可见（R2 图） | — |
| P5 | pending | — | 点赞 toggle 幂等 + 登录拦截 | — |
| P6 | pending | — | 我的/设置/退出 + UI 打磨 | — |
| P7 | pending | — | 公网部署 + 模拟器线上验收（AC-01…10） | — |

## 待办（当前步骤）

1. **用户审查并批准 P2**（better-auth、Native 会话、登录/注册/退出与验证输出）。
2. 用户批准后进入 P3（双列信息流 + 详情连真实 D1）。

## 已确认决策摘要

- ORM 用 Drizzle（DEC-06）；部署唯一 Alchemy（DEC-12）；无 Kysely/Lambda/评论/搜索/AI/双轨 IaC。
- 开放项定案（spec.md）：图片上传 = Worker 中转 PUT；likes 计数 = count(\*)；tags = JSON 字符串；分页 = cursor 按 id；page size = 10；主色 = 青绿（非商标红）；头像 = 本地默认 asset。
