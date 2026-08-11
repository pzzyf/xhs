# V1 作品集 App — 技术规格（Spec）

> 来源：`SUPERPOWER-BRIEF.md` §3–§7 + `requirements.md`。
> 开放实现细节（BRIEF §10）在本文件里定案，不再问用户。

## 1. Monorepo 布局

```text
apps/
  native/          Expo Router 客户端（iOS+Android+Web 演示）
  server/          Hono Worker 入口（worker.ts）与路由组装（app.ts）
packages/
  api/             oRPC contract + Zod（notes.list/get/create、likes.toggle、me.notes、me.profile、health）
  auth/            better-auth 配置工厂（Drizzle adapter + D1）
  db/              Drizzle schema / drizzle-kit 迁移 SQL / seed 脚本
  env/             native + server env（@t3-oss/env-core 或等价 Zod）
  infra/           alchemy.run.ts（D1+R2+Worker 唯一真相源）、env 示例
  config/          共享 tsconfig.base.json
docs/specs/v1-portfolio-app/   需求/规格/计划/工作流状态
```

删除 `apps/web`（NG-11）。不引入 Lambda（NG-12）、wrangler.jsonc（NG-13）、Kysely（DEC-06）。

## 2. 服务端

### 2.1 入口与运行时

- 唯一入口 `apps/server/src/worker.ts`（`export default { fetch }`），Hono app 在 `apps/server/src/app.ts` 组装。
- 不保留 `dev.ts`（Node）、`index.ts`（Lambda）、tsdown 配置（NG-12）。本地开发走 `alchemy dev`。
- Alchemy 声明：D1 `xhs-d1`、R2 `xhs-images`、Worker `xhs-server`，绑定名 `DB`、`IMAGES`，迁移目录 `packages/db/migrations`（沿用 Alchemy `migrationsDir` 机制）。

### 2.2 路由

| 路由 | 说明 |
|------|------|
| `GET /` | 健康检查：`{ ok: true, name, time }` |
| `/api/auth/*` | better-auth `toHono`（邮箱密码） |
| `/rpc/*` | oRPC RPCHandler（notes/likes/me） |
| `PUT /api/images` | 鉴权；二进制 body 直传 R2，返回 `{ imageKey, imageUrl }`（Worker 中转方案，BRIEF §4.4 方案 B 简化版） |
| `GET /images/:key` | 公开读 R2 图片（Content-Type 由存储对象决定） |

### 2.3 环境变量（packages/env/src/server.ts + apps/server/.env.example）

| 变量 | 必需 | 说明 |
|------|------|------|
| `BETTER_AUTH_SECRET` | 是 | better-auth 密钥 |
| `BETTER_AUTH_URL` | 是 | 部署公网 URL；本地默认 `http://localhost:3000` |
| `CORS_ORIGIN` / `CORS_ORIGINS` | 否 | 默认允许 localhost/私网开发来源 |
| `SEED_SECRET` | 否 | 种子脚本鉴权（见 §2.6） |

### 2.4 CORS

允许 localhost、loopback、私网开发来源 + `CORS_ORIGIN`/`CORS_ORIGINS` 配置的生产 web 源；不 `*` + credentials 乱开。

### 2.5 oRPC 契约（packages/api，BRIEF §4.3）

过程级（命名如下，行为不可少）：

- `health` → `{ ok: true }`（或直接用 `GET /`）
- `notes.list({ cursor?, limit = 10 })` → `{ items: NoteListItem[], nextCursor: string | null }`；按时间倒序；cursor = 上一页最后一条的 `id`（自增）的字符串形式
- `notes.get({ id })` → NoteDetail（含 likeCount、viewerHasLiked，未登录 viewerHasLiked=false）
- `notes.create({ title, body, tags, imageKey })` → NoteDetail（鉴权）
- `likes.toggle({ noteId })` → `{ liked, likeCount }`（鉴权；一人一赞幂等）
- `me.notes()` → `NoteListItem[]`（鉴权，仅自己）
- `me.profile()` → `{ id, name, email, image }`（鉴权）

**共享 Zod schema（zod v4）：**

```ts
noteListItem = { id: string, title: string, coverUrl: string, authorName: string, createdAt: string }
noteDetail    = noteListItem & { body: string, tags: string[], imageUrl: string, likeCount: number, viewerHasLiked: boolean, authorId: string }
```

id 一律字符串（D1 INTEGER PK 通过 Drizzle 映射/或直接用字符串；实现定案：**note.id 用 D1 AUTOINCREMENT INTEGER，oRPC 边界转 string**，cursor 传上一页最后 id 的字符串）。

### 2.6 种子（packages/db/seed.ts）

- 通过 `POST /api/dev/seed`（仅当 `SEED_SECRET` 环境变量匹配时才挂载，或以脚本方式本地跑）写入。
- 种子账号：`demo@xhs.dev` / 昵称「体验官小艾」+ 可注册真实账号（REQ-19）。
- 种子笔记：约 16 条（≥1.5 页，page size 10），标题/正文中文，标签 2–4 个，图片来源无版权（本仓库 `packages/db/seed-assets/` 放置无版权图或生成占位图；实现时用纯色/渐变占位 PNG 自生成，避免版权问题，也避免依赖外网图源）。
- 幂等：已存在种子账号或笔记数 > 0 时跳过或更新。

### 2.7 鉴权（packages/auth）

- better-auth 1.6.26（沿用 catalog 版本），Drizzle adapter + D1。
- 会话表由 better-auth 管理（user/session/account/verification），Drizzle schema 需包含 better-auth 核心表（按 better-auth 文档 `toDrizzleSchema` 或手写 schema）。
- 挂载在 `/api/auth/*`；Native 用 `@better-auth/expo` 客户端 + SecureStore 持久化。

## 3. 数据模型（Drizzle schema，packages/db/src/schema.ts）

```ts
users (better-auth 核心表 + 应用字段): id text pk, name, email unique, emailVerified integer, image text null, createdAt, updatedAt
session / account / verification: better-auth 标准结构

notes:
  id integer autoincrement pk
  authorId text fk -> users.id
  title text
  body text
  tags text           // JSON 数组字符串（不建 tag 表）
  imageKey text       // R2 key（imageUrl 由 key 派生，不冗余存 URL）
  createdAt integer   // epoch ms

likes:
  noteId integer fk -> notes.id
  userId text fk -> users.id
  createdAt integer
  PK (noteId, userId) // 唯一一人一赞；取消=删行；计数=count(*)
```

- 迁移：`drizzle-kit generate` → `packages/db/migrations` 下 SQL，Alchemy `migrationsDir` 应用（本地与远端）。
- **无** updatedAt 业务编辑、无 soft delete。

## 4. 客户端（apps/native）

### 4.1 路由（Expo Router，BRIEF §5）

```text
(tabs)/
  index     首页信息流 + 发布入口按钮
  me        我的主页（未登录：CTA 去登录）
publish     发布页（Stack，无 Tab）
note/[id]   详情（Stack）
sign-in     登录/注册（Stack）
settings    设置（Stack，从我的进入）
```

根布局 Provider 顺序（保持已确认层级）：`Query → Gesture → SafeArea → Keyboard → HeroUI → Toast → Auth(会话) → Theme → Expo Router Stack`。

- 无 AnonymousSession、无 GuestSession、无 PushBridge（V1 无游客会话、无推送，NG-05）。
- AuthGate 逻辑：仅写操作（发布/点赞）与「我的」页在未登录时引导登录；未登录可浏览首页与详情。
- 登录成功一律 `router.replace("/")`（REQ-17，NG-17 不回原操作）。

### 4.2 数据层（沿用 native-data-fetch Skill）

- `lib/api.ts`：base URL = `EXPO_PUBLIC_SERVER_URL`（默认 localhost:3000 / Android 10.0.2.2:3000）、10 秒超时、超时/取消错误分类。
- `lib/orpc.ts`：oRPC 客户端指向 `/rpc`。
- `lib/auth-client.ts`：better-auth Expo 客户端 + SecureStore。
- TanStack Query：AppState focus + NetInfo online（非 Web）；Web 保留默认。
- 图片请求不走 Query（直接 `<Image source={{ uri }}>`）。

### 4.3 页面要点

| 页面 | 要点 |
|------|------|
| 首页 | 双列瀑布流（FlatList numColumns=2，封面 3:4 近似社区比例），无限滚动（onEndReached 拉下一页，page size 10）；顶部标题 + 「发布」按钮（不占 Tab）；卡片=封面+标题（≤2 行）+作者昵称，不含赞 |
| 详情 | 大图（顶端）、标题、作者昵称、正文、标签（轻展示）、赞按钮+计数（需登录时点按跳 sign-in） |
| 发布 | 选 1 张图（`expo-image-picker` + 客户端压缩，最长边 1280–2048，jpeg/webp）、标题、正文、标签输入；提交成功清表单回首页（`router.replace("/")`），失败 Toast 可重试 |
| 我的 | 未登录：头像占位+CTA「去登录」；已登录：默认头像+昵称+我的笔记列表 |
| 设置 | 昵称/头像占位展示 + 「退出登录」按钮 |
| 登录/注册 | 邮箱+密码（注册含昵称），成功回首页 |

### 4.4 UI 基线

- 文案全中文；loading / 空态 / 错误态均有简单文案（如「加载中…」「暂无内容」「网络开小差了」）。
- 主色：自定义（定案：**青绿主色 `#16A085` 系 + 中性灰底，避免小红书商标红**）；现代干净。
- 头像：本地默认头像占位图（本地 asset，不用 Dicebear 外网 URL，避免离线不可用）。

### 4.5 环境变量（packages/env/src/native.ts + apps/native/.env.example）

- `EXPO_PUBLIC_SERVER_URL`（唯一必需；禁止密钥进 EXPO_PUBLIC_\*）。

## 5. 工程与安全约束

- 全删重来：删除旧 apps/packages 业务实现、旧 docs/specs/api-contract 与 xhs-product-roadmap 中与 V1 冲突内容（保留 `.git` 与 `.agents/skills/native-data-fetch`，其内容仍适用 DEC-04）；重写根 README.md、AGENTS.md。
- 密钥：`packages/infra/.env`、`apps/server/.env`、`apps/native/.env` 不入库；`.env.example` 入库。
- 验证：`bun run check-types` + scoped Biome；native 依赖 `bunx expo install --check`；服务端改动用 `alchemy dev` 临时端口验证；本地 D1 迁移验证后关闭临时进程。
- 提交：user-managed（不自动 commit、不 force push、不绕过 hooks）。

## 6. 交付阶段（P0–P7，每阶段结束 awaiting-human-review）

见 `plan/P0.md`…`plan/P7.md`。DoD 见 requirements.md §4。
