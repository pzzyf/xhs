# SPIKE-001 — oRPC 共享契约与取消链路可行性

- Status: completed
- Question: 在不让 Native 导入 Server 实现的前提下，oRPC contract-first、Hono handler、React Native Fetch 和 TanStack Query 能否组成一条支持结构化输出及取消的链路？
- Blocks decision: DEC-001
- Time budget: 30 分钟文档与当前仓库静态核对
- Environment: 只读官方文档与本地源码；不安装依赖、不修改生产代码、不访问外部系统
- Cleanup: 无临时进程、端口或测试数据

## Method

1. 对照当前 workspace、Hono app、Native API helper、Query provider 与首页 query。
2. 核对 oRPC 官方 Contract First、Implement Contract、Hono Adapter、React Native Adapter、RPCLink 和 TanStack Query Integration。
3. 检查方案是否要求 Node-only API、Server 源码跨 workspace 导入，或绕过 React Native Fetch 的 AbortSignal。

## Evidence

- oRPC contract-first 允许用 `@orpc/contract` 独立声明输入/输出，并由 `@orpc/server` 的 `implement(contract)` 构建运行时受约束的 router。
- Hono 官方适配方式使用 `RPCHandler` 处理 `/rpc/*`，与当前可复用 Hono app 结构兼容。
- oRPC React Native 适配说明常规 RPCLink 可直接使用平台 Fetch；当前范围不含受 React Native Fetch 限制的文件或流式能力。
- oRPC TanStack Query 集成提供由契约客户端生成的 query options；其调用最终进入 RPCLink Fetch，可在自定义 Fetch 边界组合调用方信号与默认超时。
- 当前 Native `apiText` 和首页 query 尚未接收 QueryFunctionContext signal，因此迁移时必须删除文本 helper 的主链路，并用测试证明取消信号到达 Fetch。

## Result

- Outcome: 可行，置信度高。
- Decision impact: 支持 DEC-001 推荐方案；无需让 Native 依赖 `apps/server`，也无需另建独立 Web/Node 客户端。
- Limitation: 文档和静态核对不能代替安装后的类型、bundle 与运行时验证；这些必须纳入实施阶段证据。
- Retained experiment code: none

## Sources

- https://orpc.dev/docs/contract-first/define-contract
- https://orpc.dev/docs/contract-first/implement-contract
- https://orpc.dev/docs/adapters/hono
- https://orpc.dev/docs/adapters/react-native
- https://orpc.dev/docs/client/rpc-link
- https://orpc.dev/docs/integrations/tanstack-query
