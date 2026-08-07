# XHS Agent Guide

## 适用范围与事实来源

- 本文件适用于整个仓库；当前没有子目录级 `AGENTS.md`。
- 以当前源码、`package.json` 脚本和配置文件为事实来源。`README.md` 用于上手，`bts.jsonc` 保存 Better-T-Stack 的可复现配置，`docs/specs/api-contract` 记录 API 契约规格与评审，`.agents/skills` 保存按需加载的专项流程。
- 仓库已删除 `todo.md`（提交 `d68e644`）；不要把已移除的路线图文件重新写进文档。
- 如果文档与代码不一致，先核实实际行为，再在任务范围内同步文档；不要照搬过时路径、旧环境变量名或已移除的脚本。
- 只把长期、跨任务都成立的规则写进 `AGENTS.md`；一次性的实现步骤放任务说明，可复用的专项流程放 Skill。

## 项目结构

- 仓库是 Bun workspace，由 Turbo 编排；默认从仓库根目录执行 workspace 命令。
- `apps/native`：Expo 57 + React Native 0.86 客户端，使用 Expo Router、TanStack Query、HeroUI Native、Uniwind、better-auth Expo 客户端。
- `apps/web`：管理后台，当前只有占位目录（`package.json` + `README.md`），尚未实现。
- `apps/server`：Hono 服务端（登录、业务接口、图片上传与 AI 接口）；当前 dev/deploy 走 Cloudflare Workers（Wrangler），绑定 D1（`xhs-d1`）与 R2（`xhs-images`）。保留 `src/dev.ts`（Node 本地入口）、`src/index.ts`（AWS Lambda handler）与 tsdown 配置，但已无 build 脚本接线。
- `packages/api`：共享 oRPC 契约（`@orpc/contract` + Zod），Native 与 Server 共同消费。
- `packages/auth`：better-auth 登录、账号与权限配置（`createAuth`）。
- `packages/db`：D1 + Kysely 建连（`createDb`）、`migrations` 数据表迁移与 `data` 演示数据。
- `packages/infra`：Cloudflare 本地运行与部署配置（`wrangler.jsonc`、`alchemy.run.ts`、`.env.example`、`.dev.vars.example`）。
- `packages/env`：基于 `@t3-oss/env-core` 与 Zod 的 Native/Server 环境变量定义。
- `packages/config`：共享的严格 TypeScript 配置。
- `docs/specs/api-contract`：API 契约需求、规格、计划、评审与工作流状态。
- `.agents/skills/native-data-fetch`：Expo/React Native 数据请求专项流程。
- Web 目标目前由 Expo Web 提供；除非用户明确要求，不新增独立 Web App 或 TanStack Router。

## 常用命令

```bash
bun install
bun run dev
bun run dev:native
bun run dev:server
bun run check-types
bun run check
```

- `bun run dev:server` 实际执行 `wrangler dev --config ../../packages/infra/wrangler.jsonc --port 3000`（`apps/server` 的 dev 脚本）；联调时必须确认实际端口。
- `bun run check` 会对整个仓库执行 `biome check --write .`，可能改写文件；工作区有无关改动时，优先对本次文件运行 scoped Biome。
- `bun run build` 当前是空操作：所有 workspace 都没有定义 build 脚本。需要生成 Server 的 Node/Lambda 产物时，在 `apps/server` 执行 `bunx tsdown` 与 `bunx tsdown --config tsdown.lambda.config.ts`。
- Server 迁移与部署（在 `apps/server` 内）：`bun run d1:migrate:local`、`bun run d1:migrate:remote`、`bun run deploy`（wrangler deploy）。迁移文件在 `packages/db/migrations`，Wrangler 配置统一在 `packages/infra/wrangler.jsonc`。
- Cloudflare 资源（根目录）：`bun run alchemy:dev|plan|deploy|adopt|destroy`，入口为 `packages/infra/alchemy.run.ts`。alchemy.run.ts 通过 dotenv 加载 `packages/infra/.env`（Cloudflare 凭据与 `ALCHEMY_PASSWORD`）与 `apps/server/.env`（服务端业务变量，后者覆盖前者）。
- Native 专项命令从 `apps/native` 执行：`bunx expo install --check`、`bun run web`。
- 不手改 `bun.lock`；依赖变化必须通过 Bun/Expo 命令产生并一并检查。

## 通用工作规则

- 开始修改前查看 `git status`、相关 diff、入口文件和相邻实现，优先沿用现有目录与模式。
- 保持改动聚焦，不回退、覆盖、格式化或提交用户的无关改动。
- 保持 TypeScript strict；不要通过放宽共享编译选项、滥用 `any` 或跳过校验来消除错误。
- JavaScript/TypeScript 遵循 Biome：Tab 缩进、双引号、自动整理 import。
- 项目专用的 Agent、Skill、脚本和配置必须放在本仓库内；不要写入用户级目录，除非用户明确要求全局安装。
- 不把 `.expo`、`dist`、`.turbo`、`.wrangler`、`.alchemy`、`ios`、`android`、`lambda.zip`、本机 IDE 配置或真实 `.env`/`.dev.vars` 提交到仓库。
- 不主动创建提交、推送或部署；只有用户明确要求时才执行。Cloudflare 资源同时由 `alchemy.run.ts` 与 `apps/server/wrangler.jsonc` 描述，同一批资源不要混用两套部署工具。提交时不要绕过 Lefthook。
- Codex 实质参与的提交，在提交信息末尾追加 `Co-authored-by: Codex <codex@openai.com>`，让 GitHub 正确标注共同贡献者。
- `lefthook.yml` 负责提交前的暂存文件 Biome 与全仓类型检查；Hook 是提交门禁，不替代任务完成前的主动验证，也不需要为它另建 Skill。
- 诊断或代码审查默认只读；只有请求包含修复或实现时才改代码。

## Native：路由与目录职责

- Expo Router 的唯一文件路由入口是 `apps/native/app`，不是旧的 `apps/native/src/app`。
- `app/_layout.tsx` 只放全局 Provider、主题和根 Stack；业务页面放在对应路由文件，非路由逻辑放 `features`、`lib`、`providers` 等目录。
- `(tabs)` 是不进入 URL 的路由分组；`(tabs)/_layout.tsx` 定义底部 Tabs（`index.tsx` 对应 `/`，`settings.tsx` 对应 `/settings`）。
- 当前 `(tabs)` 外页面：`sign-in.tsx`（登录/注册）、`publish.tsx`（发布演示）、`chat.tsx`（聊天演示）、`comments.tsx`（评论演示），均不显示底栏。
- Expo Router 会根据文件自动注册路由。`<Stack.Screen>`/`<Tabs.Screen>` 用于覆盖选项，不要仅为了“注册路由”添加无意义声明。
- 真正的底部主页面放 `(tabs)`；需要保留底栏的派生流程优先在对应 Tab 下嵌套 Stack；不要无意中把普通页面变成新 Tab。
- 路由组名不代表行为：`(auth)` 不会自动鉴权，`(tabs)` 也不会自动产生 Tabs，行为由各级 `_layout.tsx` 决定。

## Native：根 Provider 与平台行为

- 保持已经确认的根层级顺序：`Query → Gesture → SafeArea → Keyboard → HeroUI → Toast → Anonymous Session → Guest Session → Push Bridge → Theme → AuthGate → Expo Router Stack`。
- `PortalHost` 保持在 HeroUI/Toast 层内；全局 Provider 只挂一次，不要在页面重复创建 QueryClient、SafeArea、Keyboard 或通知监听器。
- `QueryClient` 必须稳定创建。非 Web 平台通过 `AppState` 同步 focus、通过 NetInfo 同步 online；Web 保留 TanStack Query 的浏览器默认行为。
- 匿名会话继续使用 SecureStore 持久化 UUID，并保留存储不可用时的内存降级。
- 游客登录（`GuestSessionProvider`）与 better-auth 会话由 `AuthGate` 统一守卫：未登录且非游客跳 `/sign-in`，已登录或游客访问 `/sign-in` 跳回 `/`。
- Push Bridge 只处理通知响应中的应用内绝对路径 `href`/`url`；不要在启动时顺带强制请求通知权限。
- 设备页面按需要使用 Safe Area、键盘避让和可滚动布局；涉及刘海、Dynamic Island、状态栏或导航栏时至少验证一个真实平台行为，不只按 Web 结果判断。

## Native：数据、配置与 UI

- Native 数据请求使用 TanStack Query；涉及 Query Provider、API helper、query hook 或移动端网络适配时，使用 `$native-data-fetch`。
- 网络层集中在 `apps/native/lib`：`api.ts`（base URL、10 秒默认超时、超时/取消错误分类）、`orpc.ts`（oRPC 客户端，指向 `/rpc`）、`auth-client.ts`（better-auth Expo 客户端与令牌清理）。不要在页面散落 base URL 和重复的原始 `fetch` 错误处理。
- query key 与 query function 放在所属 feature 附近；key 保持稳定，页面明确处理 loading、error、refresh/invalidating 状态。
- 客户端服务地址变量是 `EXPO_PUBLIC_SERVER_URL`：iOS 模拟器与 Web 默认 `localhost:3000`，Android 模拟器默认 `10.0.2.2:3000`，真机使用开发机可访问的 LAN/HTTPS 地址。
- 所有 `EXPO_PUBLIC_` 变量都会进入客户端包，禁止放密钥。新增变量时同步更新 `packages/env/src/native.ts` 与 `apps/native/.env.example`。
- 静态 Expo 配置继续放 `apps/native/app.json`；只有确实需要条件逻辑或动态值时才改用 `app.config.ts`。新增原生能力时同时检查 config plugin 和平台配置。
- Expo/React Native 原生依赖优先用 `bunx expo install <package>` 获取 SDK 兼容版本，随后运行 `bunx expo install --check`。
- 当前可同时使用 StyleSheet 与 Uniwind/HeroUI；遵循所在功能的既有模式，不在无关任务中整页迁移。不要手改生成的 `uniwind-types.d.ts`。

## Server 与共享包

- `apps/server/src/app.ts` 定义可复用的 Hono app：logger、CORS、`/rpc/*`（oRPC RPCHandler）、`/api/auth/*`（better-auth + Kysely/D1）、`GET /`。
- `dev.ts` 是 Node 本地入口（`PORT` 未设置时从 3000 向后找空闲端口），`index.ts` 暴露 AWS Lambda handler，`worker.ts` 是 Wrangler/Alchemy 使用的 Cloudflare Worker 入口。
- 当前 dev/deploy 脚本使用 Wrangler（`apps/server/package.json`），绑定 D1 `xhs-d1` 与 R2 `xhs-images`；迁移在 `packages/db/migrations`，用 `wrangler d1 migrations apply` 执行。`packages/infra/alchemy.run.ts` 声明同一批资源；改资源或绑定时要保持两套声明一致，不要混用部署工具。
- 构建：`tsdown.config.ts`（Node `dev.mjs`）与 `tsdown.lambda.config.ts`（Lambda `index.mjs`）都保持无代码拆分、自包含产物约束；项目当前没有把它们接进 package scripts，需要时在 `apps/server` 手动执行 `bunx tsdown`。
- CORS 默认允许 localhost、loopback 和私网开发来源，并可由 `CORS_ORIGIN`/`CORS_ORIGINS` 配置；不要为解决局部跨域问题无条件放开生产来源。
- 新增服务端环境变量时更新 `packages/env/src/server.ts` 与 `apps/server/.env.example`（Wrangler 本地 dev 通过 `--env-file ../../apps/server/.env` 读取，路径相对配置文件目录）；Native 与 Server 都应从 `@xhs/env` 对应入口读取环境变量。`packages/infra/.env` 只放 Cloudflare 凭据与 `ALCHEMY_PASSWORD`。
- 共享 TypeScript 规则只放 `packages/config`；两个及以上 workspace 真正复用的运行时代码才抽到共享包（当前共享契约在 `packages/api`，登录配置在 `packages/auth`，数据库在 `packages/db`）。
- 已有技术选型：D1 + Kysely、better-auth、oRPC。新能力沿用这些模式，不要另起数据库、ORM、认证或 API 层。

## 验证标准

- Markdown/说明文件：检查 diff、路径、命令与当前实现一致；无需机械运行全仓构建。
- TypeScript 或依赖改动：至少运行 `bun run check-types`，并对改动文件运行 Biome。
- Native 依赖改动：额外从 `apps/native` 运行 `bunx expo install --check`。
- Native 路由、Provider、Metro、Uniwind、app config 或原生插件改动：按风险运行 Expo 配置解析和至少一个目标平台的生产 export/bundle；不能只依赖类型检查。
- Server 路由、中间件、入口、绑定或迁移改动：运行 `bunx tsdown`（涉及 Node/Lambda 产物时再跑 lambda 配置），并用 `wrangler dev` 临时端口验证实际 GET/OPTIONS 响应；迁移改动在本地 D1 上验证后关闭临时进程。
- 跨 workspace 或构建配置改动：运行根目录 `bun run check-types`；根目录 `bun run build` 目前不执行任何任务，不能作为验证手段。
- 若执行 `bun run check`，先确认全仓写入不会污染无关改动；否则使用 scoped `bunx biome check`，需要修复时再对明确路径加 `--write`。
- 如果端口占用、已有 dev server、缺少外部权限或环境变量导致命令不能运行，报告具体命令、实际原因和未覆盖的验证范围。

## 完成条件

- 请求的行为已实际实现，不以“给出计划”或“创建文件骨架”代替完成。
- diff 仅包含本任务改动，环境示例、类型定义和文档已在需要时同步。
- 与风险相称的检查已经通过；最终回复列出关键改动、已运行检查以及未运行项及原因。
- `docs/specs/api-contract` 中的路线图条目只有在对应能力已实现并验证后才可划掉；不要把规格或计划文档当作完整需求规格。
