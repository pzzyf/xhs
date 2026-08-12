# P3 只读信息流与详情设计

- 日期：2026-08-12
- 状态：已完成对话设计确认，待用户审阅书面规格
- 阶段：P3（oRPC 契约 + 双列信息流 + 详情，只读）

## 1. 目标

完成从共享契约、Cloudflare Worker、D1/R2 到 Expo Native 的只读内容链路：未登录用户冷启动即可浏览真实种子笔记的双列信息流，上拉加载下一页，点击卡片进入详情查看大图、标题、正文、作者、标签与点赞计数。

完成标准：

- `packages/api` 成为 `notes.list/get` 唯一契约来源。
- 信息流与详情数据全部来自本地真实 D1/R2，不在客户端写死业务数据。
- 首页至少可加载 16 条种子数据，默认每页 10 条，能够展示第二页。
- 未登录与已登录均可浏览；登录状态不改变信息流内容。
- 详情页的点赞展示严格只读，不包含点击、登录跳转或 toggle。

## 2. 范围边界

### 包含

- `NoteListItem`、`NoteDetail` Zod schema 与导出类型。
- `notes.list` 游标分页和 `notes.get` 详情查询。
- oRPC Hono handler、可选会话上下文及标准错误映射。
- Native oRPC 客户端、TanStack Infinite Query、双列列表与详情页。
- 加载态、空态、错误态、重试入口及加载更多状态。
- 契约/分页辅助逻辑测试、全仓静态检查、本地 D1/R2 冒烟和页面验收。

### 不包含

- 点赞或取消点赞、点赞按钮点击、未登录点赞跳转登录。
- 笔记发布、图片上传、我的笔记和设置页数据。
- 评论、收藏、搜索、标签筛选或标签详情页。
- 为视觉演示引入客户端业务 Mock 数据。

上述能力分别留在 P4、P5、P6 或明确的 V1 非目标中。

## 3. 方案选择

采用“契约优先的纵向切片”：先固定共享 Zod/oRPC 契约，再接通 Server 查询，最后建立 Native 查询层和页面。

未采用的方案：

- 后端全部完成后再做客户端：接口稳定，但端到端反馈较晚。
- 客户端 Mock 优先：会重复定义数据结构，也弱化 P3 对真实 D1 数据链路的验证。

契约优先可以让 Server 与 Native 同时受同一类型约束，并尽早暴露字段、分页和错误语义不一致的问题。

## 4. 共享契约

`packages/api/src/contract.ts` 定义并导出：

```ts
NoteListItem = {
  id: string
  title: string
  coverUrl: string
  authorName: string
  createdAt: string
}

NoteDetail = NoteListItem & {
  body: string
  tags: string[]
  imageUrl: string
  likeCount: number
  viewerHasLiked: boolean
  authorId: string
}
```

过程：

- `notes.list({ cursor?, limit? })`：`limit` 默认 10，最小 1、最大 20；返回 `{ items, nextCursor }`。
- `notes.get({ id })`：`id` 为正整数的字符串形式；返回 `NoteDetail`。
- 现有 `health` 契约保持不变。

D1 的笔记主键继续使用自增整数，只有到 oRPC 边界时才转换为字符串。`createdAt` 使用 ISO 8601 字符串。`tags` 在 D1 中仍是 JSON 字符串，输出前解析并校验为字符串数组。

## 5. Server 架构

### 5.1 RPC 上下文

在 `apps/server/src/rpc/` 建立路由和上下文。上下文包含：

- 由 Worker `DB` binding 创建的 Drizzle 实例。
- 当前请求的 origin，用于生成公开图片 URL。
- 从 better-auth session 解析出的可选 `viewerUserId`。

会话解析失败按未登录处理；只有认证基础设施自身异常才返回服务端错误。`notes.list/get` 不要求登录。

### 5.2 `notes.list`

分页规则固定为：

```sql
WHERE notes.id < cursor
ORDER BY notes.id DESC
LIMIT limit + 1
```

首页无 cursor。多取 1 条只用于判断是否还有下一页，不返回给客户端；若存在额外记录，`nextCursor` 为本页最后一条已返回记录的 ID，否则为 `null`。

列表查询关联作者昵称，只输出卡片需要的字段，不计算点赞数。`coverUrl` 由请求 origin 与编码后的 `imageKey` 生成，不暴露 R2 内部访问方式。

### 5.3 `notes.get`

详情查询按笔记 ID 关联作者，并聚合该笔记的点赞总数。若存在 `viewerUserId`，额外查询复合主键 `(noteId, userId)` 是否存在；未登录固定返回 `viewerHasLiked: false`。

P3 客户端可只读展示计数和状态，不把状态包装成可点击控件。

## 6. Native 架构

### 6.1 客户端与查询层

- `apps/native/lib/orpc.ts`：创建指向 `${serverUrl}/rpc` 的 oRPC 客户端，沿用平台默认服务器地址，并设置 10 秒请求超时。
- `apps/native/features/home/queries.ts`：封装稳定 query key、`useInfiniteQuery` 和详情 query。
- 无限列表使用服务端 `nextCursor` 作为 `getNextPageParam`；扁平化时按 ID 去重，防止重试或重复触底造成重复卡片。
- 只有 `hasNextPage && !isFetchingNextPage` 时才触发下一页。

### 6.2 首页

首页沿用现有顶部标题与发布入口，内容区替换为 `FlatList numColumns={2}`：

- 封面固定接近 3:4 比例，避免图片加载后改变卡片高度导致滚动跳动。
- 标题最多两行，显示作者昵称，不显示点赞数。
- 首屏提供骨架或加载提示；无数据、失败和加载更多均使用中文状态文案。
- 点击卡片导航到 `/note/[id]`。

本阶段“瀑布流”指稳定双列内容流，不引入第三方不等高 masonry 组件。

### 6.3 详情

新增 `apps/native/app/note/[id].tsx`：

- 顶部大图保持原始宽高范围内的稳定布局。
- 依次展示标题、作者昵称、正文、轻量标签和点赞计数。
- 点赞区域使用非交互视图；可以根据 `viewerHasLiked` 显示只读“已赞/未赞”状态，但不得使用 `Pressable` 或导航到登录页。
- 详情独立缓存；路由 ID 变化时使用对应 query key。

## 7. 数据流

1. 首页调用 `notes.list({ limit: 10 })`。
2. Server 校验输入，从 D1 查询 11 条，映射前 10 条并返回 `nextCursor`。
3. Native 合并页数据并渲染双列卡片。
4. 滚动触底后使用 `nextCursor` 请求下一页。
5. 点击卡片进入详情路由并调用 `notes.get({ id })`。
6. Server 返回笔记、作者、图片 URL、标签、点赞计数及只读 viewer 状态。
7. Native 渲染详情，不执行任何写操作。

## 8. 错误处理

- cursor、limit 或 ID 格式非法：oRPC 输入校验返回 400。
- 笔记不存在：返回 `NOT_FOUND`，客户端展示“笔记不存在”。
- 数据库或标签 JSON 异常：记录服务端错误并返回统一内部错误，不把 SQL 或堆栈暴露给客户端。
- 请求超时或网络失败：首页/详情显示中文错误与“重新加载”入口。
- 图片加载失败：保留稳定占位区域，不影响文字内容和列表滚动位置。
- 下一页失败：保留已加载页面，只在列表尾部显示重试，不清空首屏内容。

## 9. 验证策略

### 自动验证

- 契约输入：默认 limit、最大值、非法 cursor、非法 ID。
- 分页辅助逻辑：第一页、末页、空结果和 nextCursor 计算。
- Native 页合并：跨页去重、无下一页、加载中防重复请求。
- `bun test`。
- `bun run check-types`。
- `bunx biome check` 覆盖本阶段修改文件。
- 在 `apps/native` 运行 `bunx expo install --check`。

### 本地真实资源验收

- 启动 `alchemy dev` 并确认迁移和种子数据可用。
- 调用 `notes.list` 验证第一页 10 条、第二页剩余条目及最终 `nextCursor: null`。
- 验证非法 cursor/ID 为 400、未知 ID 为 404。
- 未登录调用详情，确认 `viewerHasLiked: false` 且点赞计数正确。
- Web 或模拟器检查首页双列流、加载更多、卡片跳转和详情字段；确认业务数据均来自 API。

## 10. 阶段完成条件

- P3 计划中的契约、Server、Native 和验证项全部完成。
- 首页可稳定浏览至少 1.5 页真实种子数据，无重复卡片或滚动跳动。
- 详情未登录可见，字段完整，点赞严格只读。
- `workflow-state.md` 更新为 P3 `awaiting-human-review`，并记录验证证据。
- 不自动 commit、push、打 tag 或部署；仍遵循仓库的 user-managed 提交策略。
