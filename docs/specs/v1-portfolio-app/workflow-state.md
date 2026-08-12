# V1 作品集 App — 工作流状态（Workflow State）

> 更新规则：每阶段结束更新本文件；只有对应能力已实现并验证后才可划掉路线图条目。

## 当前状态

- **阶段**：P0（仓库清空 + monorepo 骨架）—— **awaiting-human-review**
- **总体状态**：scaffolding complete（健康检查已验证；待用户批准进入 P1）
- **提交策略**：user-managed（用户明确指示才 commit）
- **权威需求**：`SUPERPOWER-BRIEF.md`（冻结）→ `requirements.md` / `spec.md`

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
| P0 | awaiting-human-review | 2026-08-12 | `check-types` + Biome + `GET /` 健康检查 | 通过 |
| P1 | pending | — | alchemy dev 健康检查 + 本地 D1 数据 | — |
| P2 | pending | — | 注册/登录/登出全流程 | — |
| P3 | pending | — | 双列流 + 详情连真实 D1 | — |
| P4 | pending | — | 发布后列表可见（R2 图） | — |
| P5 | pending | — | 点赞 toggle 幂等 + 登录拦截 | — |
| P6 | pending | — | 我的/设置/退出 + UI 打磨 | — |
| P7 | pending | — | 公网部署 + 模拟器线上验收（AC-01…10） | — |

## 待办（当前步骤）

1. **用户审查并批准 P0**（本文件 + 骨架结构 + 健康检查结果）。
2. 用户批准后进入 P1（Alchemy 资源 + Drizzle schema/migrate/seed）。

## 已确认决策摘要

- ORM 用 Drizzle（DEC-06）；部署唯一 Alchemy（DEC-12）；无 Kysely/Lambda/评论/搜索/AI/双轨 IaC。
- 开放项定案（spec.md）：图片上传 = Worker 中转 PUT；likes 计数 = count(\*)；tags = JSON 字符串；分页 = cursor 按 id；page size = 10；主色 = 青绿（非商标红）；头像 = 本地默认 asset。
