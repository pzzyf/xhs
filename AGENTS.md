# XHS Agent Guide

## 适用范围与事实来源

- 本文件适用于整个仓库；当前没有子目录级 `AGENTS.md`。
- 以当前源码、`package.json` 脚本和配置文件为事实来源。`README.md` 用于上手，`todo.md` 记录路线图，`bts.jsonc` 保存 Better-T-Stack 的可复现配置，`.agents/skills` 保存按需加载的专项流程。
- 如果文档与代码不一致，先核实实际行为，再在任务范围内同步文档；不要照搬过时路径或旧环境变量名。
- 只把长期、跨任务都成立的规则写进 `AGENTS.md`；一次性的实现步骤放任务说明，可复用的专项流程放 Skill。

## 项目结构

- 仓库是 Bun workspace，由 Turbo 编排；默认从仓库根目录执行 workspace 命令。
- `apps/native`：Expo 57 + React Native 0.86 客户端，使用 Expo Router、TanStack Query、HeroUI Native、Uniwind。
- `apps/server`：Hono 服务端；同时支持本地 Node 进程和 AWS Lambda handler。
- `packages/env`：基于 `@t3-oss/env-core` 与 Zod 的 Native/Server 环境变量定义。
- `packages/config`：共享的严格 TypeScript 配置。
- `.agents/skills/native-data-fetch`：Expo/React Native 数据请求专项流程。
- 当前没有独立 `apps/web`；Web 目标由 Expo Web 提供。除非用户明确要求，不新增独立 Web App 或 TanStack Router。

## 常用命令

```bash
bun install
bun run dev
bun run dev:native
bun run dev:server
bun run check-types
bun run check
bun run build
```

- `bun run check` 会对整个仓库执行 `biome check --write .`，可能改写文件；工作区有无关改动时，优先对本次文件运行 scoped Biome。
- Native 专项命令从 `apps/native` 执行：`bunx expo install --check`、`bun run web`。
- Server 专项构建从 `apps/server` 执行：`bun run build`。
- 不手改 `bun.lock`；依赖变化必须通过 Bun/Expo 命令产生并一并检查。

## 通用工作规则

- 开始修改前查看 `git status`、相关 diff、入口文件和相邻实现，优先沿用现有目录与模式。
- 保持改动聚焦，不回退、覆盖、格式化或提交用户的无关改动。
- 保持 TypeScript strict；不要通过放宽共享编译选项、滥用 `any` 或跳过校验来消除错误。
- JavaScript/TypeScript 遵循 Biome：Tab 缩进、双引号、自动整理 import。
- 项目专用的 Agent、Skill、脚本和配置必须放在本仓库内；不要写入用户级目录，除非用户明确要求全局安装。
- 不把 `.expo`、`dist`、`.turbo`、`ios`、`android`、`lambda.zip`、本机 IDE 配置或真实 `.env` 提交到仓库。
- 不主动创建提交、推送、部署或调用 `apps/server` 的 AWS 更新脚本；只有用户明确要求时才执行。提交时不要绕过 Lefthook。
- Codex 实质参与的提交，在提交信息末尾追加 `Co-authored-by: Codex <codex@openai.com>`，让 GitHub 正确标注共同贡献者。
- `lefthook.yml` 负责提交前的暂存文件 Biome 与全仓类型检查；Hook 是提交门禁，不替代任务完成前的主动验证，也不需要为它另建 Skill。
- 诊断或代码审查默认只读；只有请求包含修复或实现时才改代码。

## Native：路由与目录职责

- Expo Router 的唯一文件路由入口是 `apps/native/app`，不是旧的 `apps/native/src/app`。
- `app/_layout.tsx` 只放全局 Provider、主题和根 Stack；业务页面放在对应路由文件，非路由逻辑放 `features`、`lib`、`providers` 等目录。
- `(tabs)` 是不进入 URL 的路由分组；`(tabs)/_layout.tsx` 定义底部 Tabs，`index.tsx` 对应 `/`，`settings.tsx` 对应 `/settings`。
- Expo Router 会根据文件自动注册路由。`<Stack.Screen>`/`<Tabs.Screen>` 用于覆盖选项，不要仅为了“注册路由”添加无意义声明。
- 真正的底部主页面放 `(tabs)`；登录、详情、发布等不应显示底栏的页面放在 `(tabs)` 外。需要保留底栏的派生流程优先在对应 Tab 下嵌套 Stack；不要无意中把普通页面变成新 Tab。
- 路由组名不代表行为：`(auth)` 不会自动鉴权，`(tabs)` 也不会自动产生 Tabs，行为由各级 `_layout.tsx` 决定。

## Native：根 Provider 与平台行为

- 保持已经确认的根层级顺序：`Query → Gesture → SafeArea → Keyboard → HeroUI → Toast → Anonymous Session → Push Bridge → Navigation Theme → Expo Router Stack`。
- `PortalHost` 保持在 HeroUI/Toast 层内；全局 Provider 只挂一次，不要在页面重复创建 QueryClient、SafeArea、Keyboard 或通知监听器。
- `QueryClient` 必须稳定创建。非 Web 平台通过 `AppState` 同步 focus、通过 NetInfo 同步 online；Web 保留 TanStack Query 的浏览器默认行为。
- 匿名会话继续使用 SecureStore 持久化 UUID，并保留存储不可用时的内存降级。
- Push Bridge 只处理通知响应中的应用内绝对路径 `href`/`url`；不要在启动时顺带强制请求通知权限。
- 设备页面按需要使用 Safe Area、键盘避让和可滚动布局；涉及刘海、Dynamic Island、状态栏或导航栏时至少验证一个真实平台行为，不只按 Web 结果判断。

## Native：数据、配置与 UI

- Native 数据请求使用 TanStack Query；涉及 Query Provider、API helper、query hook 或移动端网络适配时，使用 `$native-data-fetch`。
- 统一通过 `apps/native/lib/api.ts` 请求服务，不在页面散落 base URL 和重复的原始 `fetch` 错误处理。
- query key 与 query function 放在所属 feature 附近；key 保持稳定，页面明确处理 loading、error、refresh/invalidating 状态。
- 客户端服务地址变量是 `EXPO_PUBLIC_SERVER_URL`：iOS 模拟器与 Web 默认 `localhost:3000`，Android 模拟器默认 `10.0.2.2:3000`，真机使用开发机可访问的 LAN/HTTPS 地址。
- 所有 `EXPO_PUBLIC_` 变量都会进入客户端包，禁止放密钥。新增变量时同步更新 `packages/env/src/native.ts` 与 `apps/native/.env.example`。
- 静态 Expo 配置继续放 `apps/native/app.json`；只有确实需要条件逻辑或动态值时才改用 `app.config.ts`。新增原生能力时同时检查 config plugin 和平台配置。
- Expo/React Native 原生依赖优先用 `bunx expo install <package>` 获取 SDK 兼容版本，随后运行 `bunx expo install --check`。
- 当前可同时使用 StyleSheet 与 Uniwind/HeroUI；遵循所在功能的既有模式，不在无关任务中整页迁移。不要手改生成的 `uniwind-types.d.ts`。

## Server 与共享包

- `apps/server/src/app.ts` 定义可复用的 Hono app、路由和中间件；`dev.ts` 只负责本地 Node 启动；`index.ts` 只暴露 Lambda handler。
- 保持本地入口与 Lambda 入口兼容。修改构建时保留 `tsdown.config.ts` 和 `tsdown.lambda.config.ts` 的无代码拆分、自包含产物约束，不要让 `lambda.zip` 依赖遗漏的共享 chunk。
- 本地端口未显式配置时会从 3000 向后寻找空闲端口；联调时必须确认实际端口。若服务端自动切到 3001 等端口，同步设置 Native 的 `EXPO_PUBLIC_SERVER_URL`，不要误把另一个 3000 进程当成本次服务。
- CORS 默认允许 localhost、loopback 和私网开发来源，并可由 `CORS_ORIGIN`/`CORS_ORIGINS` 配置；不要为解决局部跨域问题无条件放开生产来源。
- 新增服务端环境变量时更新 `packages/env/src/server.ts` 与 `apps/server/.env.example`；Native 与 Server 都应从 `@xhs/env` 对应入口读取环境变量。
- 共享 TypeScript 规则只放 `packages/config`；只有两个及以上 workspace 真正复用的运行时代码或配置才抽到共享包。
- Hono 代码增长时把路由和中间件拆成小而可测试的单元，但不要提前引入数据库、ORM、认证或 API 层；当前 `bts.jsonc` 明确这些选项尚未启用。

## 验证标准

- Markdown/说明文件：检查 diff、路径、命令与当前实现一致；无需机械运行全仓构建。
- TypeScript 或依赖改动：至少运行 `bun run check-types`，并对改动文件运行 Biome。
- Native 依赖改动：额外从 `apps/native` 运行 `bunx expo install --check`。
- Native 路由、Provider、Metro、Uniwind、app config 或原生插件改动：按风险运行 Expo 配置解析和至少一个目标平台的生产 export/bundle；不能只依赖类型检查。
- Server 路由、中间件、入口或构建配置改动：运行 Server build；涉及 CORS/API 时用临时端口验证实际 GET/OPTIONS 响应，并关闭临时进程。
- 跨 workspace 或构建配置改动：运行根目录 `bun run build`。
- 若执行 `bun run check`，先确认全仓写入不会污染无关改动；否则使用 scoped `bunx biome check`，需要修复时再对明确路径加 `--write`。
- 如果端口占用、已有 dev server、缺少外部权限或环境变量导致命令不能运行，报告具体命令、实际原因和未覆盖的验证范围。

## 完成条件

- 请求的行为已实际实现，不以“给出计划”或“创建文件骨架”代替完成。
- diff 仅包含本任务改动，环境示例、类型定义和文档已在需要时同步。
- 与风险相称的检查已经通过；最终回复列出关键改动、已运行检查以及未运行项及原因。
- `todo.md` 只有在对应能力已实现并验证后才可划掉；不要把路线图条目当作完整需求规格。
