# Specification: api-contract

- Spec status: draft
- Requirements revision: sha256:154b32f0c2d523b946666ea054da5dc577fdd2b4f63535da4f708d9a9b6c3bc6
- Technical options status: confirmed
- Options confirmed by: user
- Options confirmed at: 2026-08-07T11:15:00+08:00
- Options confirmed revision: sha256:24d64c6844a85b99b78e7d5f1d17063f2810558cb4da87c0eeb5558d55c5e870

## Scope, Non-Goals, and Invariants

- REQ-001/REQ-002：新增独立共享契约 workspace；Server 与 Native 只能从该包消费 API 输入/输出契约，Native 不得从 `apps/server` 导入类型或实现。
- REQ-003/REQ-004：所有 Native oRPC HTTP 调用经过单一传输边界。调用方信号先中止时属于主动取消；内部 10 秒期限先到时属于超时；二者不能互相误分类。
- REQ-005：Hono app 继续同时被本地 Node 入口和 Lambda handler 使用；平台 base URL、CORS 与现有 Provider 层级不变。
- REQ-006：页面只展示稳定、安全的中文错误摘要，不展示 RPC 响应体、堆栈或内部端点。
- 非目标完全继承 requirements.md；不引入认证、数据库、上传、流、独立 Web 或部署行为。

## State, Data, and Ownership

- API 契约由 `packages/api-contract` 所有，包含 procedure router、Zod 输入/输出 schema 和可供客户端推导的类型。
- Server 拥有契约实现与 Hono 挂载；RPC 前缀固定为 `/rpc`。
- Native API 模块拥有环境感知 base URL、oRPC client、默认超时、信号组合和错误归类。
- TanStack Query 拥有查询缓存与取消生命周期；query options/函数不得丢弃其提供的 signal。
- 不新增持久化数据。每次请求只拥有一个内部 AbortController 和一个超时计时器；settle 后必须解除外部 signal listener 并清理计时器。

## Interfaces and Compatibility

### Shared contract

- `contract.health`：输入严格满足 `z.object({}).strict()`，输出严格满足 `z.object({ message: z.string().min(1) }).strict()`；未知输入字段必须被拒绝。
- 契约通过 oRPC contract-first API 定义；Server 必须通过 contract implementer 组装完整 router，使输入与输出运行时校验生效。
- `packages/api-contract` 不读取环境变量、不引用 React Native/Hono/Node API，也不导出 Server router 实现。

### Server HTTP surface

- `GET /`：返回 HTTP 200、`application/json` 与 `{ "message": "Hello Hono!" }`，仅作兼容/健康入口。
- `/rpc/*`：由 oRPC `RPCHandler` 挂载，前缀为 `/rpc`；`contract.health` 返回同一结构化问候对象。
- 未匹配的 `/rpc` 请求继续交给 Hono 后续处理并最终产生标准未找到响应。
- 现有 CORS allow headers/methods/origin 策略不放宽。

### Native surface

- 导出稳定的 `apiBaseUrl` 与类型安全 API facade；底层 oRPC client/RPCLink 保持模块私有，任何应用调用者都不能绕过统一期限与取消分类。RPC URL 为 `${apiBaseUrl}/rpc`。RPCLink 必须安装 `ResponseValidationPlugin(contract)`，客户端对成功响应再次执行共享输出 schema 的运行时校验。
- 默认超时常量为 10,000ms。测试或明确调用可覆盖期限；非有限或非正数期限必须同步拒绝，不能静默变成无限等待。
- 超时包装位于完整 procedure call 外层：公开 facade 创建组合 signal、调用模块私有 oRPC client、等待解码与 ResponseValidationPlugin 完成，并只在整个 client promise settle 后清理 timer/listener。仅在自定义 Fetch resolve 时不得提前清理期限。
- Native 首页 query function 显式接收 TanStack Query 的 signal，并调用公开类型安全 facade；facade 将组合 signal 传给私有 `client.health({}, { signal })`。页面渲染 `data.message`，不再消费文本 helper。
- 旧 `apiText` 不再作为首页主链路；若无其他调用者则删除，避免两套请求错误模型并存。

## Failure, Recovery, and Boundary Behavior

- 正常完成：返回经过 oRPC/Zod 校验的对象，清理 listener 和 timer。
- 主动取消：外部 signal 已中止或先触发时，底层 Fetch signal 中止；保留标准取消语义，`isApiAbortError` 可识别，TanStack Query 不把它包装为超时。
- 默认超时：内部期限先触发时中止底层 Fetch；完整 client promise 以 `ApiTimeoutError`（含稳定 code 与 timeoutMs，不含响应体）拒绝。慢响应头、慢响应体、RPC 解码和响应校验都在同一期限内。
- 竞态：以首次中止来源为准；settle 后到达的第二个事件不能改变已确定分类。
- oRPC/远端错误：`ORPCError`/defined error 保留供程序处理；页面映射为“服务暂时不可用”，不得显示服务端 message/data。
- 契约响应错误：ResponseValidationPlugin 拒绝 schema 非法的成功 envelope；页面映射为“响应数据格式错误”。
- 网络错误：保留原始 Error 作为 cause（运行时支持时），页面显示“网络连接失败，请稍后重试”。
- Query retry：取消错误和超时错误默认不由 QueryClient 自动重试；其他瞬态错误继续遵循现有上限，但不得覆盖 procedure 级显式设置。
- Server 输出不符合 schema：RPC 返回失败，不得把非法对象序列化成成功响应。

## Security, Privacy, and Operational Safety

- 不新增凭据、Cookie、Authorization 逻辑或生产端点。
- 错误摘要和验证证据不记录响应体、个人数据、密钥或完整私有 URL。
- 依赖使用 Bun 正常解析并检查 lockfile；不手改 `bun.lock`。
- 本地临时服务使用明确端口，验证后关闭；不调用现有 AWS `update`/`deploy` 脚本。
- 兼容路由不扩大 CORS 或暴露运行时环境信息。

## Domain-Specific Contract

- API：以真实启动的 Hono 服务验证 JSON、RPC、CORS 与未匹配路径；以定向测试验证 schema 和错误分类。
- Mobile：验证 Expo 配置解析、依赖兼容检查和 Expo Web production export；此外必须在至少一个 iOS/Android 模拟器或真机上通过延迟 RPC 请求执行取消，观察 Query 取消状态与 Server/Fetch 中止。若本机没有可用目标或无法启动，AC-003 保持 `blocked-external`，不得宣称 Native 取消已验证。
- Infrastructure/migration：N/A，本任务不改变部署拓扑、云资源、schema 或持久化格式。

## DEC-001 — 契约所有权与客户端类型边界

- Significant option: yes
- Status: confirmed
- Requirements/risks: REQ-001, REQ-002, RISK-001
- Chosen option: 推荐新建 `packages/api-contract`，仅依赖 `@orpc/contract` 与 Zod，使用 contract-first 定义契约；Server 通过 `implement(contract)` 实现，Native 通过 `ContractRouterClient<typeof contract>` 调用。
- Evidence/spikes: SPIKE-001；oRPC 官方 Define/Implement Contract、Hono Adapter、React Native Adapter 与 Monorepo 指南；待安装后以 workspace 构建验证实际导出边界。
- Benefits and costs: Native 不导入 Server 实现，输入/输出具有单一事实源和运行时校验；成本是新增一个 workspace 和 oRPC 契约依赖。
- Operational/migration/lock-in consequences: API 类型会绑定 oRPC contract-first 格式，但契约包不拥有业务实现或环境配置，未来可从该边界生成/迁移其他传输层。
- Rejected alternatives and reasons: 直接从 `apps/server` 导出 router 类型会把客户端绑定到服务端运行时；手写泛型 `apiJson<T>` 只有编译期断言、不能保证服务端输出；纯 Hono RPC 不满足用户指定的 oRPC。
- Confirmed by: user
- Confirmed at: 2026-08-07T11:15:00+08:00
- Confirmed revision: sha256:6a8f5923ed46a66df39dd99683c6009acd6cf6dca9314e7c3b0dc3a4d3dba894

`Confirmed revision` is the digest/revision of this DEC's canonical confirmation payload, not the mutable whole-file digest.

## DEC-002 — 现有根路由兼容策略

- Significant option: yes
- Status: confirmed
- Requirements/risks: REQ-002, REQ-005, RISK-003
- Chosen option: 推荐保留 `GET /` 作为结构化 JSON 健康/兼容入口，同时把 Native 首页迁移到 `/rpc` 下的契约过程；后续业务请求只新增到共享 oRPC 契约。
- Evidence/spikes: 当前 README、Native 首页 query 与 Server smoke 入口均依赖 `/`；源码搜索未发现其他路由。
- Benefits and costs: 避免突然删除已有公共入口，并立刻消除纯文本响应；成本是短期保留一个不经过 oRPC 的健康入口。
- Operational/migration/lock-in consequences: `/` 只承诺最小 `{ message: string }` 响应，不演化为第二套业务 API；可在未来有明确版本迁移时单独弃用。
- Rejected alternatives and reasons: 立即删除 `/` 会产生不必要的兼容破坏；继续返回纯文本不满足结构化 JSON；让 Native 继续调用 `/` 则无法证明 oRPC 主链路。
- Confirmed by: user
- Confirmed at: 2026-08-07T11:15:00+08:00
- Confirmed revision: sha256:6180a6ebd91d553684fa5a6ad790686c00c4b3d641b3240b28cd290938999d46

`Confirmed revision` is the digest/revision of this DEC's canonical confirmation payload, not the mutable whole-file digest.

## Milestones

### M1 — 可取消的类型安全 JSON RPC 主链路

- Goal: Native 首页通过共享 oRPC 契约调用真实 Hono handler，并具备经过验证的成功、超时、主动取消和安全错误呈现。
- Scope: 共享契约包、Server RPC/JSON 入口、Native transport/query 迁移、定向测试、构建与运行时 smoke。
- Non-scope: 业务 procedure、认证、数据库、上传、流、部署和真机发布认证。

## AC-001 — 共享契约驱动真实 RPC

- Requirements: REQ-001, REQ-002
- Decisions: DEC-001, DEC-002
- Milestone: M1
- Verification class: API/integration
- Method: 类型检查、契约测试及临时 Hono 服务真实 RPC 请求。
- Passing condition: Native/Server 只从共享包消费契约；RPC 与 `GET /` 均返回合法 `{ message: string }` JSON；非法输入被真实 RPC 拒绝；Server 非法输出和格式正确但 schema 非法的客户端成功 envelope 均不能成为成功数据。
- Invalidation inputs: 契约、router、Hono 挂载、客户端 link、Zod/oRPC/Hono 版本。

## AC-002 — 超时稳定且可诊断

- Requirements: REQ-003, REQ-006
- Decisions: DEC-001
- Milestone: M1
- Verification class: deterministic/integration
- Method: 只从公开 API facade 发起调用，使用可控完整 client-call/Fetch 测试替身分别延迟连接、响应体和最终解码/校验，并检查错误映射；静态导出检查确认底层 client/link 不公开。
- Passing condition: 所有公开调用不可绕过 10 秒默认值；短期限在任一阶段触发 `ApiTimeoutError`，底层 signal 已中止，timer/listener 被清理，页面映射为稳定超时文案；包导出不存在原始 client/link。
- Invalidation inputs: transport、timer、AbortController、RPCLink、错误映射、运行时 Fetch。

## AC-003 — 主动取消贯穿 Query 到 Fetch

- Requirements: REQ-004, REQ-006
- Decisions: DEC-001
- Milestone: M1
- Verification class: integration
- Method: 外部 AbortController 与 TanStack Query `cancelQueries` 定向自动化测试；至少一个 iOS/Android 模拟器或真机对延迟 RPC 的实际取消检查。
- Passing condition: 自动化与 Native 目标上的取消均中止 Fetch/请求，保持取消分类且不成为超时；Query 不继续重试。没有 Native 目标证据时 AC-003 不通过。
- Invalidation inputs: query options、client call options、transport、QueryClient defaults、TanStack/oRPC 版本。

## AC-004 — 运行入口与移动构建兼容

- Requirements: REQ-005
- Decisions: DEC-002
- Milestone: M1
- Verification class: build/runtime
- Method: 根类型检查、scoped Biome、Server 双构建、Expo install check/config/export、临时端口 GET/RPC/OPTIONS smoke。
- Passing condition: 所有命令退出码为 0；本地与 Lambda 构建保留；Expo Web production export 成功；CORS 未放宽且 API 地址规则不变。
- Invalidation inputs: package manifests/lockfile、TS/build/Expo config、Server 入口、CORS、环境变量。

## AC-005 — 错误类别完整且不泄露内部信息

- Requirements: REQ-006
- Decisions: DEC-001
- Milestone: M1
- Verification class: deterministic/integration
- Method: 分别注入远端 ORPCError、schema 非法成功 envelope 和普通网络失败，检查分类 predicate 与页面消息。
- Passing condition: 三类错误可区分；页面分别使用稳定安全摘要，均不包含远端 message/data、响应体、堆栈或完整端点。
- Invalidation inputs: RPCLink/plugins、错误 predicate/mapper、页面错误渲染、oRPC/Zod/Fetch 版本。

## Traceability Summary

| Requirement/risk | Decision/spike | Acceptance | Milestone |
|---|---|---|---|
| REQ-001, REQ-002 / RISK-001 | DEC-001, DEC-002, SPIKE-001 | AC-001 | M1 |
| REQ-003, REQ-006 / RISK-002 | DEC-001 | AC-002 | M1 |
| REQ-004, REQ-006 / RISK-002 | DEC-001 | AC-003 | M1 |
| REQ-005 / RISK-003 | DEC-002 | AC-004 | M1 |
| REQ-006 / RISK-001, RISK-002 | DEC-001 | AC-005 | M1 |
