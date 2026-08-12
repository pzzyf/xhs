# V1 作品集 App — 工作流状态（Workflow State）

> 更新规则：每阶段结束更新本文件；只有对应能力已实现并验证后才可划掉路线图条目。

## 当前状态

- **阶段**：P7 —— **deployed**（公网 HTTP + Web 线上主路径通过；模拟器完整录证部分完成）
- **总体状态**：P0–P6 完成并提交；P3/P4/P5 已推 GitHub 并打 tag（v0.4.0/v0.5.0/v0.6.0）；P7 部署完成并通过公网 HTTP/Web 线上验收；Android 模拟器已打到同一线上 API；iOS 模拟器未跑
- **提交策略**：user-managed（用户明确指示才 commit）
- **权威需求**：`SUPERPOWER-BRIEF.md`（冻结）→ `requirements.md` / `spec.md`

## P7 收尾（2026-08-12）

已完成（平台侧，均经 Cloudflare API 核实）：

- 部署 `alchemy deploy -- --yes`：Worker `xhs-server` + D1 `xhs-d1` + R2 `xhs-images` 创建成功；`alchemy plan` → noop（远端与声明一致）
- 公网地址：`https://xhs-server.0624afe1.workers.dev`；workers.dev 子域 enabled；部署版本 active
- 生产配置：`BETTER_AUTH_URL` 已改为公网 URL 并重部署（API 核实 binding 生效）
- 线上 D1：迁移已自动应用（表齐全）；通过 D1 query API 写入种子（user=1 / notes=16，AC-19 数据侧）
- README/AGENTS/workflow-state 收尾更新；`apps/native/.env` 已配 `EXPO_PUBLIC_SERVER_URL`（gitignored）

线上验收（本机 *.workers.dev 直连被网络阻断，经本机 HTTP 代理与同源面纱完成）：

- 公网 `GET /` 200；seed 接口幂等（R2 补传 16 张图片）；`GET /images/seed/note-01.png` 200 image/png
- 公网 HTTP 全链路：signup/upload/create（新笔记置顶）/likes toggle/me.notes/me.profile/匿名 401 全部通过
- Web 线上全量 AC-01…AC-09（经同源面纱 http://localhost:3001 → 公网 Worker，Cookie 双向翻译）：全绿，控制台 0 error
- Android 模拟器（Pixel_8_API_36 + Expo Go 57.0.3）：首页双列流/详情数据来自生产 D1/R2；原生「未登录点赞→登录页」通过

未完成（如实记录）：

- 模拟器完整录证仅部分：Android 原生注册/发布/点赞/退出的完整 UI 剧本未录（adb 自动化不稳，线上 D1 无对应测试账号）；iOS 模拟器未跑
- 直连 `*.workers.dev` 在本网被阻断（连 workers.dev 根域也 reset），线上复验依赖本机代理/面纱；正式公网使用建议绑定自定义域名

## P6 收尾（2026-08-12）

已完成：

- 契约 `me.notes()` → 本人笔记倒序；`me.profile()` → 基础字段（image 恒 null）；未登录 401
- `notes-service.listMine/getProfile` + router me.notes/me.profile（含 NOT_FOUND）；FakeD1 覆盖
- 我的主页：未登录头像占位 +「去登录」CTA + 空态；已登录头像/昵称/邮箱 + 我的笔记双列列表（点击进详情）+ 设置入口
- 设置页：头像/昵称/邮箱展示 + 退出登录（signOut → 清会话 → 回首页 + Toast）；修复会话恢复前误重定向（isPending 判断）
- UI 打磨：抽出 `components/avatar.tsx`、`components/page-header.tsx`，笔记卡片移至 `components/note-card.tsx`；首页改用 PageHeader；全站中文与青绿 token 一致

验证（`alchemy dev` + Metro Web :8081）：

- `bun test` 88/88 通过（13 files）；`check-types` 6/6；Biome 47 文件 0 诊断；`expo install --check` 依赖一致
- HTTP：me.profile 返回当前用户（image null）；me.notes 仅本人笔记；匿名 401
- Web（headless Chromium）：未登录我的 → 去登录；注册后我的显示昵称/邮箱/空态 → 发布后我的笔记列表可见 → 设置显示身份 → 退出登录回首页（浏览正常）→ 我的重新显示去登录 → 点赞再次要求登录；控制台 0 error
- 截图：`/tmp/p6-me-empty.png`、`/tmp/p6-me-with-note.png`、`/tmp/p6-settings.png`

未实测项：iOS 状态栏/安全区（本环境无模拟器），全屏页面均使用 SafeAreaView。

## P5 收尾（2026-08-12）

已完成：

- 契约 `likes.toggle({ noteId })` → `{ liked, likeCount }`；未登录 401、不存在笔记 404
- `notes-service.toggleLike`：like 行存在则删、否则插入（likes 复合主键保证一人一赞幂等）；返回最新赞态与 `count(*)`
- 详情页赞按钮交互：未登录显示计数 +「登录后点赞」，点击跳登录（登录成功回首页，NG-17）；已登录乐观更新（pending 禁点）+ 失败回滚 + Toast；`useMutation` 就地更新缓存

验证（`alchemy dev` + Metro Web :8081）：

- `bun test` 78/78 通过（13 files）；`check-types` 6/6；Biome 37 文件 0 诊断
- HTTP：toggle1 `{liked:true,likeCount:1}` → toggle2 `{liked:false,likeCount:0}`；匿名 401；不存在笔记 404；重新读取详情状态一致
- Web（headless Chromium）：未登录详情见「点赞 · 0 + 登录后点赞」→ 点击跳登录；注册后回首页再进详情 → 点赞「已赞 · 1 / 点击取消」→ 取消「点赞 · 0 / 点击点赞」→ 重进详情一致；控制台 0 error
- 截图：`/tmp/p5-detail-liked.png`

## P4 收尾（2026-08-12）

已完成：

- `PUT /api/images`：better-auth 会话鉴权、Content-Type image/* 校验、10MB 上限、`notes/<uuid>.<ext>` key、R2 写入、返回 key/url；未登录 401
- `apps/server/src/auth.ts`：抽取 createAuth/getSession 复用，app.ts 三处挂载（auth/rpc/upload）统一
- 契约 `notes.create({ title ≤40, body ≤2000, tags ≤5 个且每个 ≤20 字, imageKey })` → `NoteDetail`；oRPC 未登录 UNAUTHORIZED
- `notes-service.create`：Drizzle insert + returning + 返回详情；FakeD1 支持 insert 测试
- Native 发布页 `app/publish.tsx`：选图（expo-image-picker）→ 预览 → 压缩（最长边 1600，jpeg）→ 上传 → 创建 → 首页刷新；失败 Toast + 表单保留；未登录直接引导登录
- 首页「发布」按钮接入发布页（原占位提示移除）

验证（`alchemy dev` + Metro Web :8081）：

- `bun test` 67/67 通过（13 files）；`check-types` 6/6；Biome 37 文件 0 诊断；`expo install --check` 依赖一致
- HTTP：带会话 PUT 小图 → 200 + key；无会话 401；`GET /images/<key>` 200 image/png；`notes.create` 200（id=17）且列表置顶；无会话 create 401
- Web 全流程（headless Chromium）：未登录点发布 → 注册 → 发布页选图/填表 → 发布成功回首页且新笔记置顶、作者正确、首卡图片真实加载（R2）→ 详情含正文/标签/只读赞摘要；控制台 0 error
- 截图：`/tmp/p4-publish.png`、`/tmp/p4-home-new-note.png`、`/tmp/p4-detail-new-note.png`

环境事实：发布验收新增本地用户与笔记（worktree D1/R2，未触碰主工作区）。

## P3 收尾（2026-08-12）

已完成：

- `packages/api/src/contract.ts`：`notes.list`（cursor 字符串、limit 1–20 默认 10）、`notes.get`、`health` 契约，Zod 校验测试覆盖非法 cursor/limit
- `apps/server/src/rpc/`：`note-utils`（tags 解析、图片 URL、limit+1 分页）、`notes-service`（Drizzle 读 + 作者 join + `likeCount=count(*)` + `viewerHasLiked`）、`router`（oRPC implement，NOT_FOUND 中文 404）
- `apps/server/src/app.ts`：`/rpc/*` 挂载（better-auth 会话注入 viewerUserId）+ 公共 `GET /images/*`（R2 读、immutable 缓存）
- Native 数据层：`lib/server-url.ts`（平台默认 10.0.2.2）、`lib/orpc.ts`（类型化客户端、cookie 转发、10s 超时 + 取消）、`features/notes/queries.ts`（infiniteQuery/detail、query-options 稳定 key、分页去重）
- 首页双列流：`NoteCard`（3:4 封面、两行标题、作者）、FlatList `numColumns=2` 无限滚动、loading/空/错/页脚态中文
- 详情页：`app/note/[id].tsx` 大图/标题/作者/正文/标签/只读赞摘要（非交互、未登录可见）+ 无效 ID 与加载失败态；`note-route` 归一化测试

验证（本地 alchemy dev + Metro Web :8081）：

- `bun test` 53/53 通过（12 files）；`bun run check-types` 6/6 workspace；scoped Biome 32 文件 0 诊断；`expo install --check` 依赖一致
- RPC：第一页 10 条（id 16..7，nextCursor "7"）→ 第二页 6 条（id 6..1，nextCursor null）；非法 cursor 400；不存在笔记 404
- 详情：id=1 全字段、`viewerHasLiked=false`、`likeCount=0`、绝对图片 URL；`/images/seed/note-01.png` 200 `image/png`
- Web（headless Chromium 390×844，未登录）：首页 10 卡 → 滚动加载第二页共 16 张、出现「已经到底了」、无重复；封面宽高比 0.75（3:4）、双列等宽 167px；列表无赞计数；详情完整且「只读展示」不可点；缺失笔记显示「笔记加载失败」+「重新加载」；控制台无新增运行错误（仅缺失探针的 404 RPC）

环境事实：

- 与 P2 相同：worktree 本地 D1 迁移记录存在但表缺失，验收时手动将 `0000` 迁移应用到 worktree D1；未修改主工作区数据
- 将主工作区 `apps/server/.env` 复制到 worktree（gitignored，本地运行所需）；8081 空闲，Web 验收使用默认端口
- 截图证据：`/tmp/p3-home-top.png`、`/tmp/p3-home-bottom.png`、`/tmp/p3-detail.png`、`/tmp/p3-detail-missing.png`

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
| P2 | 完成 | 2026-08-12 | HTTP + Web 注册/登录/会话保持/登出 | 通过 |
| P3 | 完成 | 2026-08-12 | HTTP RPC + Web 双列流/详情/错误态 | 通过（用户豁免审查） |
| P4 | 完成 | 2026-08-12 | HTTP 上传/创建 + Web 发布全流程 | 通过 |
| P5 | 完成 | 2026-08-12 | HTTP toggle + Web 点赞/取消/重进一致 | 通过 |
| P6 | 完成 | 2026-08-12 | HTTP me + Web 我的/设置/退出 | 通过 |
| P7 | implemented | 2026-08-12 | 平台侧部署 + D1 种子（API 核实）；公网 HTTP 验收被网络阻断 | 部分 |

## 待办（当前步骤）

1. 待可访问 `*.workers.dev` 的网络或自定义域名后：公网 `GET /` 复验、线上 R2 图片上传、AC-01…AC-10 线上端到端复验。

## 已确认决策摘要

- ORM 用 Drizzle（DEC-06）；部署唯一 Alchemy（DEC-12）；无 Kysely/Lambda/评论/搜索/AI/双轨 IaC。
- 开放项定案（spec.md）：图片上传 = Worker 中转 PUT；likes 计数 = count(\*)；tags = JSON 字符串；分页 = cursor 按 id；page size = 10；主色 = 青绿（非商标红）；头像 = 本地默认 asset。
