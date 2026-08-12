# Web 同源托管 + 真实图片 + 体验账号与分发 — 设计

日期：2026-08-12
状态：已确认（用户口头批准）

## 背景

P7 已将 Worker + D1 + R2 部署至 `https://xhs-server.0624afe1.workers.dev`。现需要：

1. 把 Web 版部署上线（最初设想 Vercel，后改为 Cloudflare，最终定为现有 Worker 同源托管）。
2. 种子笔记图片目前是运行时生成的渐变色 PNG，需替换为真实照片。
3. README 提供体验账号与截图（首页 / 详情 / 我的），并提供 Web、Android 安装包分发入口；iOS 暂不提供。

### 关键约束（探索结论）

- better-auth 会话 Cookie 为 `SameSite=Lax`：跨站（vercel.app / pages.dev → workers.dev）请求浏览器不携带 Cookie，登录必然失效；改 `SameSite=None+Secure` 则受 Safari 第三方 Cookie 策略影响。**同源托管彻底规避该问题。**
- Expo Web 为 `"output": "static"` 静态导出；动态路由 `/note/[id]` 无法预渲染，深链需 SPA 兜底。
- Worker 免费档脚本体积上限 1MiB（压缩后）：16 张照片不得内嵌进 Worker bundle。
- 线上 D1 已有 demo 用户（无密码，无法登录）与 16+ 条笔记；R2 已有渐变占位图。变更必须幂等、可增量补齐。
- 线上笔记行引用的 R2 key 为 `seed/note-XX.png`，不可更改 key（避免改数据），仅覆盖对象内容。
- 本机具备：Xcode 26.3、Android SDK、JDK 17、`gh`（已登录 pzzyf）。无 EAS CLI / Expo 账号；用户明确 iOS 暂不提供安装包。

## 设计

### 1. Web 部署：Worker 同源静态托管

- 构建：`expo export --platform web`，构建时注入 `EXPO_PUBLIC_SERVER_URL=https://xhs-server.0624afe1.workers.dev`，产物 `apps/native/dist`（已 gitignore）。新增根脚本 `build:web`。
- 部署：`packages/infra/alchemy.run.ts` 中 `Cloudflare.Worker` 增加 `assets: "./apps/native/dist"`。alchemy 原生支持 assets（本地 `alchemy dev` 同样生效，`:3000` 即完整应用）。
- 路由语义：命中静态资源清单 → 资源层直出；`/api/*`、`/rpc/*`、`/images/*` 不在清单中 → 落 Hono app（现状不变）。
- SPA 兜底：Hono 增加 catch-all GET 兜底路由，对未匹配的 GET 路径（如 `/note/123`）经 `env.ASSETS.fetch` 返回 `/index.html`。`ServerEnv` 类型补充 `ASSETS` 绑定（Fetcher）。
- Origin 校验：浏览器同源 POST 会携带 `Origin: https://xhs-server.0624afe1.workers.dev`，better-auth 要求其在 `trustedOrigins` 中 → `apps/server/.env` 的 `CORS_ORIGINS` 追加该 URL，随本次部署生效（auth.ts 已将 CORS_ORIGINS 并入 trustedOrigins，无需改代码）。
- 部署前校验：grep 产物确认内联的是公网 URL 而非 localhost（防止误传本地构建的 dist）。
- 注意：截图用本地产物与线上产物共用 `dist/` 目录且内联 URL 不同。执行顺序：先构建本地版（localhost:3000）完成截图与冒烟，部署前再重建线上版并 grep 校验。

### 2. 真实图片：Unsplash 精选入库

- 素材：按 16 条笔记主题（咖啡/慢跑/意面/阅读/绿植/夜市/胶片/拉伸/改造/日落/汽水/博物馆/书桌/陶艺/耳机/市集）从 Unsplash 精选照片，**逐一验证 URL 可下载**，缩放裁剪为约 480×640 JPEG（macOS `sips`），存 `packages/db/seed-photos/note-XX.jpg`，附 `packages/db/seed-photos/UNPLASH.md`（来源链接 + Unsplash License 说明）。
- 不内嵌 Worker：新增受 `x-seed-secret` 保护的上传路由 `PUT /api/dev/seed/images/:key`（key 限 `seed/` 前缀，body 上限约 8MiB），写入 R2，content-type 取请求头。
- 新增脚本 `bun run seed:images -- <serverUrl>`（默认 `http://localhost:3000`）：读取 `packages/db/seed-photos/` 与 `apps/server/.env` 的 `SEED_SECRET`，逐个 PUT。本地（alchemy dev）与线上通用。
- 保留 R2 key `seed/note-XX.png` 不变，仅覆盖内容为 JPEG（R2 存 `image/jpeg` content-type；key 后缀仅为标识，不影响分发）。
- `POST /api/dev/seed` 保留渐变图逻辑，仅对 R2 缺失的 key 兜底上传（现状行为）。

### 3. 体验账号

- 常量：`DEMO_PASSWORD = "demo123456"`（packages/db 导出，仅 demo 用途，非机密）。
- seed 流程（服务端 routes/seed.ts）在 `runSeed` 之后幂等补齐 credential：查询 demo 用户的 `account`（providerId=`credential`），缺失则用 better-auth `hashPassword`（`better-auth/crypto`，workerd 兼容）写入哈希。线上重跑一次 `POST /api/dev/seed` 即补齐密码，不影响已有用户与笔记。

### 4. 截图

- 本地 `alchemy dev`（:3000 同时提供 Web 与 API）+ 本地构建的 dist（`EXPO_PUBLIC_SERVER_URL=http://localhost:3000`）+ 本地 seed（真实图片 + demo 密码）。
- headless Chrome：puppeteer-core + 系统 Chrome，安装于仓库外临时目录（不污染仓库依赖）。视口 390×844 @2x，流程：登录 demo 账号 → 首页 → 点开详情 → 我的 tab。
- 产物：`docs/screenshots/home.png`、`detail.png`、`me.png`（入库）。

### 5. 分发

| 平台 | 方式 |
| --- | --- |
| Web | README「在线体验」：Worker URL + demo 账号 |
| Android | 本机 `expo prebuild` 生成 android/（gitignore），自生成 keystore 签 release APK（Gradle），`gh release create` 挂 GitHub Releases；README 给下载链接 + 「允许未知来源」安装说明 |
| iOS | 暂不提供；README 说明使用 Web 版体验 |

- Release 基于新里程碑 tag `v1.1.0`（v1.0.0 已用于 P7），资产命名 `xhs-android-<version>.apk`。
- commit / tag / push / release 为显式步骤，执行前逐一向用户确认（仓库硬性规则）。

### 6. 文档

- README：新增「在线体验」（Web 地址、demo 账号、三张截图、Android 下载、iOS 说明、workers.dev 可达性提示）；更新「本地开发」种子步骤（seed:images）与「部署」步骤（build:web 先于 alchemy:deploy）。
- `docs/specs/v1-portfolio-app/workflow-state.md`：记录本轮变更与验收结果。

## 测试与验收

- 服务端单测（bun:test）：新增上传路由鉴权/前缀限制、seed 幂等补 account、SPA 兜底路由；既有用例回归。
- `bun run check-types`、`bun run check` 全绿。
- 本地冒烟：`alchemy dev` → 首页出图（真实照片）→ demo 登录 → 详情/我的/点赞/退出。
- 线上：部署后复验静态首页、深链 `/note/:id`、demo 登录、图片；重跑 seed 补密码；seed:images 覆盖 16 图。
- Android：APK 在模拟器安装验证（打到线上 API）后上传 Release。

## 非目标

- 不做 iOS 安装包、不做 EAS/EAS Update、不做自定义域名与 CDN、不做评论/搜索等 NG 项。
