# V1 作品集 App — 工作流状态（Workflow State）

> 更新规则：每阶段结束更新本文件；只有对应能力已实现并验证后才可划掉路线图条目。

## 当前状态

- **阶段**：P0（仓库清空 + monorepo 骨架）—— **暂停，次日继续**
- **总体状态**：scaffolding（P0 删除与骨架重建已完成，健康检查初验成功，未收尾）
- **提交策略**：user-managed（用户明确指示才 commit）
- **权威需求**：`SUPERPOWER-BRIEF.md`（冻结）→ `requirements.md` / `spec.md`

## 暂停记录（2026-08-12，用户叫停，次日继续）

已完成：

- 规格 scaffold：requirements.md / spec.md / plan/P0–P7.md / workflow-state.md
- 用户确认全删重来 → 删除旧 apps/*、packages/* 业务实现、旧 docs/specs/api-contract、旧 AGENTS.md/readme.md（保留 .git）
- 重建骨架：packages/env（zod env）、packages/api（oRPC contract 壳）、packages/db（Drizzle 占位）、packages/auth（占位）、packages/infra（alchemy.run.ts：D1 xhs-d1 + R2 xhs-images + Worker xhs-server）、apps/server（Hono worker + CORS + 健康检查）、apps/native（Expo Router 壳 + Query/Theme/HeroUI provider）
- `bun run check-types` 全绿；Biome check 通过；`expo install --check` 通过
- `alchemy dev` 本地起服务成功：`GET /` 健康检查可访问（输出 `{ url: "http://localhost:3000" }`）

未完成（下次继续）：

- P0 收尾：健康检查输出记录、awaiting-human-review 汇报
- 根 `AGENTS.md`、`README.md` 重写（P0 计划内，尚未执行）
- P1 起全部阶段

注意（下次继续时的环境事实）：

- `apps/server/.env` 已建本地开发密钥（gitignored，不入库）
- `packages/infra/.env` 未建（部署时才需要 Cloudflare 凭据，需用户授权）
- `packages/db/migrations` 目录已建（Alchemy dev 要求存在）

## 检查点记录

| 阶段 | 状态 | 日期 | 验收方式 | 结果 |
|------|------|------|----------|------|
| P0 | awaiting-human-review（待删除确认） | — | `bun run check-types` + scoped Biome | — |
| P1 | pending | — | alchemy dev 健康检查 + 本地 D1 数据 | — |
| P2 | pending | — | 注册/登录/登出全流程 | — |
| P3 | pending | — | 双列流 + 详情连真实 D1 | — |
| P4 | pending | — | 发布后列表可见（R2 图） | — |
| P5 | pending | — | 点赞 toggle 幂等 + 登录拦截 | — |
| P6 | pending | — | 我的/设置/退出 + UI 打磨 | — |
| P7 | pending | — | 公网部署 + 模拟器线上验收（AC-01…10） | — |

## 待办（当前步骤）

1. P0 收尾汇报（健康检查初验已通过，awaiting-human-review）。
2. 重写根 `AGENTS.md`、`README.md`。
3. 用户批准后进入 P1（Alchemy 资源 + Drizzle schema/migrate/seed），依此类推至 P7。

## 已确认决策摘要

- ORM 用 Drizzle（DEC-06）；部署唯一 Alchemy（DEC-12）；无 Kysely/Lambda/评论/搜索/AI/双轨 IaC。
- 开放项定案（spec.md）：图片上传 = Worker 中转 PUT；likes 计数 = count(\*)；tags = JSON 字符串；分页 = cursor 按 id；page size = 10；主色 = 青绿（非商标红）；头像 = 本地默认 asset。
