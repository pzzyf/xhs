# V1 作品集 App — 工作流状态（Workflow State）

> 更新规则：每阶段结束更新本文件；只有对应能力已实现并验证后才可划掉路线图条目。

## 当前状态

- **阶段**：P1（Alchemy 资源 + Drizzle Schema/Migrate/Seed）—— **awaiting-human-review**
- **总体状态**：数据层就绪（迁移已应用、种子 16 条已验证；待用户批准进入 P2）
- **提交策略**：user-managed（用户明确指示才 commit）
- **权威需求**：`SUPERPOWER-BRIEF.md`（冻结）→ `requirements.md` / `spec.md`

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
| P1 | awaiting-human-review | 2026-08-12 | alchemy dev 迁移 + 种子 + D1 直查 | 通过 |
| P2 | pending | — | 注册/登录/登出全流程 | — |
| P3 | pending | — | 双列流 + 详情连真实 D1 | — |
| P4 | pending | — | 发布后列表可见（R2 图） | — |
| P5 | pending | — | 点赞 toggle 幂等 + 登录拦截 | — |
| P6 | pending | — | 我的/设置/退出 + UI 打磨 | — |
| P7 | pending | — | 公网部署 + 模拟器线上验收（AC-01…10） | — |

## 待办（当前步骤）

1. **用户审查并批准 P1**（schema/迁移/种子 + 验证输出）。
2. 用户批准后进入 P2（better-auth 注册/登录/登出）。

## 已确认决策摘要

- ORM 用 Drizzle（DEC-06）；部署唯一 Alchemy（DEC-12）；无 Kysely/Lambda/评论/搜索/AI/双轨 IaC。
- 开放项定案（spec.md）：图片上传 = Worker 中转 PUT；likes 计数 = count(\*)；tags = JSON 字符串；分页 = cursor 按 id；page size = 10；主色 = 青绿（非商标红）；头像 = 本地默认 asset。
