# Requirements: api-contract

- Requirements status: confirmed
- Confirmed by: user
- Confirmed at: 2026-08-07T11:03:49+08:00
- Confirmed revision: sha256:154b32f0c2d523b946666ea054da5dc577fdd2b4f63535da4f708d9a9b6c3bc6

## Product Goal

把当前 Native → Hono 的文本请求升级为具备共享运行时契约的结构化 oRPC 调用，并确保请求既能按统一期限超时，也能由调用方或 TanStack Query 主动取消。

## Users and Core Scenarios

- Native 开发者通过类型安全客户端调用服务端，不重复声明输入输出类型。
- Native 页面通过 TanStack Query 发起请求；组件卸载、查询取消或显式取消时终止底层网络请求。
- 请求超过默认期限时以可识别的超时错误失败；调用方传入的取消信号仍保持取消语义。
- Server 开发者从共享契约实现 Hono oRPC handler，输入和输出都接受运行时校验。

## Non-Goals

- 不实现认证、数据库、内容发布、Feed、社交、消息或 Push 业务。
- 不新增独立 Web App，不改变 Expo Router、Provider 树或部署拓扑。
- 不部署到 AWS/Cloudflare，不修改生产环境或真实数据。
- 不在本阶段实现文件上传、流式响应、批处理或 OpenAPI UI。

## REQ-001 — 共享 oRPC 契约

- Statement: Native 和 Server 必须消费同一份独立共享契约，契约使用 Zod 描述输入与结构化 JSON 输出，Native 不得导入 Server 实现源码。
- Priority: must
- Verification direction: 类型检查证明两端绑定同一契约；真实 RPC 请求返回契约规定的对象。

## REQ-002 — 结构化 JSON 响应

- Statement: 当前首页问候请求必须从无结构文本迁移为具名字段的 JSON 对象，并在服务端执行输出契约校验。
- Priority: must
- Verification direction: 真实请求响应可解析为契约对象，错误 Content-Type 或非法输出无法被当成成功数据使用。

## REQ-003 — 默认请求超时

- Statement: Native oRPC 网络请求必须具有统一默认超时，并以可判别的超时错误终止；超时定时器在成功、失败或取消后必须清理。
- Priority: must
- Verification direction: 可控延迟请求超过期限后失败且底层信号已中止；快速请求正常完成且无遗留计时器行为。

## REQ-004 — 主动取消传播

- Statement: 调用方 AbortSignal 和 TanStack Query 的取消必须传播到 oRPC 使用的 Fetch 请求，同时不能被错误归类为超时。
- Priority: must
- Verification direction: 显式取消与 Query 取消均观察到 AbortError/取消状态，服务端或 Fetch 测试替身观察到信号中止。

## REQ-005 — 兼容现有运行入口

- Statement: Hono 本地 Node 入口与 Lambda handler 构建必须继续工作，开发 CORS 规则和平台 API 地址解析必须保持有效。
- Priority: must
- Verification direction: Server 双构建、根类型检查、Expo 配置/依赖检查通过，临时端口上的 RPC 成功与 OPTIONS 响应符合预期。

## REQ-006 — 错误边界可诊断

- Statement: Native 必须能够区分超时、主动取消、oRPC 契约/远端错误和其他网络错误，并向现有页面提供安全的用户可读消息。
- Priority: must
- Verification direction: 定向测试覆盖错误分类，页面不显示原始敏感响应体或不可读对象。

## Quality Requirements

- Reliability: 默认超时暂定 10 秒；Query 重试不得把主动取消当成普通失败继续重试。
- Compatibility: 支持当前 Expo 57 / React Native 0.86、Expo Web、本地 Hono Node 进程和 Lambda bundle。
- Maintainability: 契约放独立 workspace；请求超时与信号组合逻辑集中在 Native API 层。
- Security/privacy: 日志和测试证据不得记录密钥、个人数据或私有端点；本任务不新增凭据。

## Risks and Unknowns

### RISK-001 — oRPC 契约所有权造成耦合

- Impact: 若直接从 Server 导出路由类型，Native 会与服务端运行时及打包边界耦合。
- Evidence needed: oRPC 官方 contract-first、monorepo 与 Hono 文档；workspace 构建验证。
- Blocks decision: DEC-001

### RISK-002 — React Native Fetch 取消行为差异

- Impact: 错误组合 AbortSignal 可能导致取消失效、错误分类错误或计时器泄漏。
- Evidence needed: 可控 Fetch 测试替身、TanStack Query 取消集成检查、目标平台生产 export。
- Blocks decision: none

### RISK-003 — 公共入口兼容性

- Impact: 直接删除现有 `/` 文本入口可能破坏已有 smoke check 或外部调用者。
- Evidence needed: 当前源码、README 和调用搜索；临时服务实际请求。
- Blocks decision: DEC-002

## Success Measures

- REQ-001/REQ-002：Native 首页通过共享 oRPC 契约取得结构化 `{ message: string }` 数据。
- REQ-003/REQ-004/REQ-006：自动化检查分别证明成功、超时和主动取消三条互斥路径。
- REQ-005：类型检查、Biome、Expo 依赖检查、Native production export、Server build 和临时端口 RPC/CORS smoke 全部通过。

## Confirmation Record

用户于 2026-08-07 将原始全路线目标明确收敛为“只实现超时、取消、结构化 JSON、oRPC/API 契约”；该明确限界的请求作为本要求集的确认来源。显著技术选项仍使用独立确认门禁。
