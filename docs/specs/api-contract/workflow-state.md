# Workflow State: api-contract

- Run ID: SDD-20260807T030330Z-80b8da
- Artifact root: docs/specs/api-contract
- Rigor: standard
- Rigor rationale: 变更跨共享包、Native 与 Server，并新增公共 RPC 契约和核心网络集成；不涉及认证、生产迁移或部署，Standard 与风险相称。
- Commit policy: user-managed
- Delivery target: implemented
- Workflow status: options-confirmed
- Technical options status: confirmed
- Current milestone: M1
- Current phase: none
- Current task: none
- Base revision: git:2e735e6a0134d195e9440ea0bcf9060c899d44d0
- Initial dirty paths: none
- Initial staged paths: none
- Owned paths: docs/specs/api-contract; packages/api-contract; apps/server/src; apps/server/package.json; apps/native/lib; apps/native/features/home; apps/native/app/(tabs)/index.tsx; apps/native/package.json; package.json; bun.lock
- Last checkpoint: 2026-08-07T11:15:00+08:00
- Next safe action: 计算确认摘要并对冻结规格执行 fresh-context 独立评审。
- Review mode: independent

## Goal and Boundaries

- Goal: 实现统一超时、主动取消、结构化 JSON 和共享 oRPC API 契约。
- Non-goals: 认证、数据库、业务功能、独立 Web、部署、生产变更、文件/流式传输。
- Intended delivery meaning: implemented 表示代码和本地证据完整；不表示已部署或真机全矩阵发布验证完成。

## Capability and Authority Preflight

| Capability/action | Available? | Authorized? | Evidence, boundary, or approval needed |
|---|---|---|---|
| Local read/write | yes | yes | 用户请求实现；仅修改任务 owned paths。 |
| Dependency install | yes | yes | 实现 oRPC 所需的正常 workspace 依赖安装；通过 Bun 生成 lockfile。 |
| Network/external API | limited | yes-read-only | 仅查阅官方文档和获取公开依赖；不执行外部写操作。 |
| Browser/device | browser yes; device unknown | local verification only | 可做 Expo Web/export 与本地 API；真机若不可用必须明确记录。 |
| Credentials/secrets | not needed | no | 不读取或记录真实凭据。 |
| Production data/system | not needed | no | 严禁生产访问或修改。 |
| Deploy/release | not needed | no | 本任务仅 implemented。 |
| Destructive/non-idempotent action | not needed | no | 仅可清理本任务创建的临时进程/文件。 |
| Fresh-context reviewer | yes | yes | 规格、计划和代码冻结后使用只读独立 reviewer。 |

## Version-Control Baseline

- Repository kind: git
- Branch: main
- Initial staged paths: none
- Initial unstaged paths: none
- Initial untracked paths: none
- Overlap policy: 发现用户改动或暂存内容时保持 user-managed，绝不覆盖或吸收无关改动。

## Active Resources and Cleanup

| Resource | Identifier/port/path | Owner | State | Cleanup/query action |
|---|---|---|---|---|
| none | none | none | none | none |

## External Operation Ledger

| Operation ID / idempotency key | Target and intended effect | Subject revision | Pre-state | Rollback/recovery | State | Recovery query | Result evidence |
|---|---|---|---|---|---|---|---|
| none | none | none | none | none | none | none | none |

## Retry and Diagnostic State

- Current blocker: none
- Same-cause attempts: 0
- Last hypothesis/result: 用户明确确认 DEC-001/DEC-002 与 10 秒默认超时，恢复流程。
- Next differentiated action: 独立评审规格，关闭 blocking/important findings 后编写 M1 计划。
- Exact resume condition: none

## Status History

| At | From | To | Reason | Artifact/evidence references |
|---|---|---|---|---|
| 2026-08-07T03:03:30Z | none | draft | Workflow initialized. | git:2e735e6a0134d195e9440ea0bcf9060c899d44d0 |
| 2026-08-07T11:03:49+08:00 | broad-roadmap | scoped-api-contract | 用户明确只实现 Network/API 的四项能力；改用 Standard 规格。 | requirements.md |
| 2026-08-07T11:08:00+08:00 | draft | draft | 完成不改生产代码的 oRPC 边界可行性验证。 | SPIKE-001 |
| 2026-08-07T11:12:00+08:00 | draft | blocked-external | 连续三次目标回合仍缺少显著技术选项的人类确认；按流程暂停生产代码修改。 | DEC-001, DEC-002 |
| 2026-08-07T11:15:00+08:00 | blocked-external | options-confirmed | 用户回复“确认”，确认共享 contract-first、JSON 兼容入口、Native `/rpc` 与 10 秒默认超时。 | DEC-001, DEC-002 |
