# Superpower 交接简报：XHS V1 作品集 App（全删重来）

> 本文是 grilling 会话冻结结果，可直接作为 Superpower / spec-driven 代理的**唯一需求权威**起点。  
> 确认时间：2026-08-11  
> 确认方式：用户 grilling 逐题确认  
> 仓库：`/Users/afe1/Documents/github/xhs`（保留 git 历史与远端，**业务与配置全部删除后重建**）

---

## 0. 你要做什么（一句话）

在**当前仓库清空重写**，从 0 交付一个**可公网演示**的小红书风格内容社区 App（作品集向）：  
**Expo（iOS+Android）+ Hono on Cloudflare Workers + D1 + R2 + better-auth + oRPC + Drizzle + Alchemy**，主路径能演示即可，边角可用种子数据。

**完成线（Definition of Done）：**  
Workers **已部署公网** + iOS/Android **模拟器连接线上 API** 完整走通主路径；开箱有种子内容。

---

## 1. 目标与非目标

### 1.1 目标

| ID | 需求 |
|----|------|
| REQ-01 | 个人作品集 Demo：90 秒内像「真 App」（产品完成度优先于工程炫技） |
| REQ-02 | 主路径可演示；边角 case 允许硬编码/种子，不追求生产级完备 |
| REQ-03 | 客户端：Expo，**iOS + Android 模拟器都能跑**（真机非必须） |
| REQ-04 | 真后端：自有 API + DB，App **不写死**业务列表数据 |
| REQ-05 | 后端跑在 **Cloudflare Workers**，有公网 URL |
| REQ-06 | 存储：**D1（SQL）+ R2（图片）** |
| REQ-07 | 鉴权：**better-auth** 邮箱+密码；未登录可直接浏览首页 |
| REQ-08 | API：**oRPC + 共享 Zod 契约**（monorepo 内端到端类型） |
| REQ-09 | 仓库形态：**Bun monorepo**（`apps/native` + `apps/server` + `packages/*`，Turbo） |
| REQ-10 | 信息流：**双列瀑布流 + 无限滚动**，封面比例接近内容社区 |
| REQ-11 | 发布：单图真上传 R2 + 标题 + 正文 + 标签字段 |
| REQ-12 | 详情：大图 + 标题 + 正文 + 作者昵称 + 点赞（总数 + 是否已赞） |
| REQ-13 | 点赞：需登录；一人一赞可取消；**仅详情页**展示赞态/计数，列表不显示 |
| REQ-14 | 我的主页：默认头像 + 昵称 + 我发布的笔记列表 |
| REQ-15 | 设置：展示当前昵称/头像占位 + 退出登录 |
| REQ-16 | 导航：底部两 Tab「首页 \| 我的」；发布为首页/导航栏按钮，不占 Tab |
| REQ-17 | 未登录点「发布/赞」→ 跳转登录页；登录成功**一律回首页** |
| REQ-18 | 首页信息流与登录态无关（同一套公开内容） |
| REQ-19 | 种子数据：迁移/脚本写入示例笔记 + 可注册真实账号；开箱首页有内容 |
| REQ-20 | UI 文案**仅中文**；视觉「神韵」现代干净，**不抄**小红书品牌资产/商标红 |
| REQ-21 | 部署轨：**Alchemy 唯一**声明与部署 Cloudflare 资源；不维护第二套平行 IaC |
| REQ-22 | 技术栈锁定见 §3 |

### 1.2 明确非目标（V1 禁止做）

| ID | 非目标 |
|----|--------|
| NG-01 | 评论（整段不做） |
| NG-02 | 收藏 |
| NG-03 | 搜索 |
| NG-04 | 关注/粉丝 |
| NG-05 | 推送通知 |
| NG-06 | 任何 AI 能力 |
| NG-07 | 笔记编辑/删除 |
| NG-08 | 用户头像上传（仅默认占位图） |
| NG-09 | 多图发布 |
| NG-10 | 标签筛选/标签详情页（标签可存，UI 不强调展示） |
| NG-11 | 独立 Web 管理后台 / TanStack Router Web App |
| NG-12 | AWS Lambda / Node 长期双运行时（若需本地脚本可极简，不以 Lambda 为交付） |
| NG-13 | Wrangler 与 Alchemy **双轨并行维护**两套资源真相源 |
| NG-14 | 从旧代码 copy-paste 大段业务实现（允许对照思路，必须按本规格重写） |
| NG-15 | 公司项目代码/资源/密钥任何复用 |
| NG-16 | 国际化、改密、邮箱验证、手机号登录 |
| NG-17 | 登录后恢复原操作（赞/发布续上）——V1 固定回首页 |

---

## 2. 用户可见主路径（验收剧本）

按顺序全部在**线上 API**上通过（iOS 或 Android 模拟器至少一端完整录证，另一端能启动并打到同一 API）：

1. **冷启动未登录** → 进入首页 → 看到种子笔记双列瀑布流 → 上拉加载更多（若种子不足一页，至少接口支持分页且客户端接好）。
2. **点卡片** → 详情：大图、标题、正文、作者昵称、赞按钮与计数（未登录显示计数，点赞触发登录）。
3. **点赞（未登录）** → 跳转登录页。
4. **注册**（邮箱+密码+昵称）→ 成功后回首页。
5. **再进同一详情** → 点赞 → 计数 +1、已赞态；再点取消 → 计数 -1。
6. **首页点发布**（已登录）→ 选 **1 张图** → 填标题/正文/标签 → 提交 → 成功后信息流/我的可见该笔记（图来自 R2）。
7. **上传失败** → Toast 错误，用户可重新走发布（不要求断点续传）。
8. **我的** → 默认头像 + 昵称 + 我的笔记列表 → 可进详情。
9. **设置** → 看到昵称/默认头像 → 退出 → 可继续浏览首页，写操作再次要求登录。
10. **公网**：`GET` 健康检查或等价公开端点可从公网访问；App 的 `EXPO_PUBLIC_SERVER_URL` 指向该部署。

---

## 3. 技术决策（已冻结，勿再选型辩论）

| ID | 决策 | 备注 |
|----|------|------|
| DEC-01 | Bun workspaces + Turborepo | 根目录编排 |
| DEC-02 | `apps/native`：Expo Router + RN 新版稳定 SDK | 用 `expo install` 对齐版本 |
| DEC-03 | UI：HeroUI Native + 项目既有样式方案（Uniwind 若与 HeroUI 模板一致则用；保持一种主风格） | 神韵向，中文 |
| DEC-04 | 数据请求：TanStack Query | 含 AppState focus / NetInfo online（非 Web） |
| DEC-05 | `apps/server`：Hono 跑在 CF Workers | 入口与 binding 由 Alchemy 管理 |
| DEC-06 | ORM：**Drizzle** + D1 | **不用 Kysely** |
| DEC-07 | 对象存储：R2 | 笔记封面图 |
| DEC-08 | 契约：`packages/api` oRPC contract + Zod | Native/Server 共用 |
| DEC-09 | 鉴权：`packages/auth` better-auth（邮箱密码）+ Expo 客户端 | 会话安全存储 |
| DEC-10 | 环境变量：`packages/env`（t3-env 或等价 Zod） | 禁止密钥进 `EXPO_PUBLIC_*` |
| DEC-11 | 格式化/Lint：Biome | |
| DEC-12 | 基础设施：`packages/infra` + **Alchemy** | D1 + R2 + Worker 单一真相源 |
| DEC-13 | 包管理：Bun；不手改 lock 以外手段 | |
| DEC-14 | 类型：严格 TypeScript；共享 tsconfig 在 `packages/config` | |

### 建议 monorepo 布局（重建后）

```text
apps/
  native/          Expo Router 客户端
  server/          Hono Worker 入口与路由组装
packages/
  api/             oRPC contract + Zod
  auth/            better-auth 配置工厂
  db/              Drizzle schema / migrations / seed
  env/             native + server env
  infra/           alchemy.run.ts、env 示例
  config/          tsconfig
docs/specs/v1-portfolio-app/   本简报与后续 spec/plan
```

**不要**创建 `apps/web` 业务后台（除非用户后改口）。

---

## 4. 领域模型（最小）

### 4.1 表（逻辑；Drizzle 实现时可微调命名，语义不变）

**user**（better-auth 核心表 + 应用字段）

- id, email, emailVerified, name（昵称）, image（V1 恒为 null/默认）, createdAt, updatedAt
- 及 better-auth 所需 session/account 表

**note**

- id, authorId → user  
- title, body, tags（文本或 JSON 字符串数组均可；**不建 tag 表**）  
- imageKey / imageUrl（R2）  
- createdAt  
- 无 updatedAt 业务编辑；无 soft delete 要求

**like**

- noteId + userId 唯一  
- createdAt  
- 取消赞 = 删行  
- 计数 = count(*) 或冗余计数（V1 任选，正确优先）

### 4.2 权限

| 动作 | 未登录 | 已登录 |
|------|--------|--------|
| 浏览信息流/详情 | ✅ | ✅ |
| 点赞/取消 | ❌ → 登录页 | ✅ |
| 发布 | ❌ → 登录页 | ✅ |
| 看我的笔记 | 可进「我的」但引导登录或空态 | ✅ 仅自己 |
| 改/删笔记 | — | ❌ V1 无 |
| 改资料/头像 | — | ❌ V1 无（昵称注册时设定） |

**无服务端游客用户、无匿名 session。** 「游客」= 未登录浏览。

### 4.3 API 能力清单（oRPC 过程级，命名可改，行为不可少）

- `health` 或 HTTP `GET /`
- `notes.list`：分页（cursor 或 offset + limit），按时间倒序；返回封面、标题、作者昵称、笔记 id
- `notes.get`：详情 + 点赞总数 +（若已登录）viewerHasLiked
- `notes.create`：鉴权；元数据 + 图片上传策略见下
- `likes.toggle` 或 `like`/`unlike`：鉴权；幂等一人一赞
- `me.notes`：鉴权；当前用户笔记列表
- `me.profile`：鉴权；昵称等  
- Auth 走 better-auth 自带 `/api/auth/*`，不要重复造登录 RPC

### 4.4 图片上传（选一种实现，推荐 A）

**推荐 A：** 客户端请求 Worker 签发 R2 预签名 PUT（或 Worker 中转 upload），成功后 `notes.create` 带 `imageKey`。  
**可接受 B：** `multipart` 直打 Worker，Worker 写 R2 再写 D1（注意 Workers 请求体大小限制，单图需压缩）。

V1 约束：

- 仅 1 张图  
- 客户端提交前应压缩到合理大小（例如最长边 1280～2048，jpeg/webp）  
- 失败：Toast，整单重来  

### 4.5 分页

- 信息流必须分页；默认 page size 建议 10 或 20（实现时固定一个并写进契约）  
- 种子数据建议 ≥ 1 页半，便于演示上拉  

---

## 5. 客户端 IA / 路由

```text
(tabs)/
  index      首页信息流 + 发布入口按钮
  me         我的主页（未登录：CTA 去登录）
publish      发布页（Stack，无 Tab）
note/[id]    详情（Stack）
sign-in      登录/注册（Stack）
settings     设置（Stack，从我的进入）
```

根布局：QueryClient、Gesture、SafeArea、Keyboard、HeroUI、Toast、Theme、Auth 会话、Expo Router。  
**不要**未登录强制整 app 墙登录页；仅写操作与「需要身份的页」跳转登录。

---

## 6. UI 基线

- 中文文案  
- 双列瀑布流卡片：封面（保持比例）、标题最多 2 行、作者昵称  
- 详情：顶部大图、标题、作者、正文、底部或 dual 赞按钮+计数  
- 发布：选图预览、标题、正文、标签输入、提交  
- 现代干净；主色自定，**避免**小红书商标红+logo 仿冒  
- Loading / 空态 / 错误态要有，文案简单即可  

---

## 7. 工程与安全约束

1. **全删重来**：删除旧 `apps/*`、`packages/*` 业务实现、旧 docs 规格中与本 V1 冲突的过时内容；**不要**把旧 Kysely/Lambda/双轨 Wrangler 逻辑搬回来。可保留 `.git`。重建后重写根 `README.md`、`AGENTS.md`（简洁、与真源码一致）。  
2. **密钥**：`packages/infra/.env`、`apps/server/.env`、`apps/native/.env` 示例入库；真密钥不入库。  
3. **CORS**：允许本地 Expo/模拟器来源与配置的生产 web 源；不 `*` + credentials 乱开。  
4. **提交**：除非用户明确说 commit，否则不自动 commit；不 force push；不绕过 hooks。  
5. **验证**：`check-types` + Biome；native 依赖用 `expo install --check`；关键路径用 wrangler/alchemy dev 或已部署 URL 实测。  
6. **完成声称**：只有公网部署 + 模拟器连线上主路径跑通才可称 **deployed**；仅本地通过称 **implemented**。  

---

## 8. 建议交付阶段（给 Superpower 拆 phase 用）

每阶段结束必须 **awaiting-human-review**，用户批准后再进下一阶段。

| Phase | 可演示检查点 |
|-------|----------------|
| P0 | 仓库清空策略执行 + monorepo 骨架 + Biome/Turbo/TS 能 `check-types` |
| P1 | Alchemy 声明 Worker+D1+R2；本地 dev 健康检查；Drizzle schema+migrate+seed |
| P2 | better-auth 注册登录登出；Native 会话；未登录可进首页壳 |
| P3 | oRPC `notes.list/get` + 双列信息流 + 详情（只读）连真实 D1 种子 |
| P4 | R2 上传 + `notes.create` + 发布页；发布后列表可见 |
| P5 | 点赞 toggle + 登录拦截 + 回首页策略 |
| P6 | 我的主页 + 设置退出；中文 UI 打磨 |
| P7 | Alchemy 部署公网；配置 Native 线上 URL；按 §2 剧本验收 + README 演示说明 |

---

## 9. 给代理的启动指令（可复制）

```text
使用 spec-driven-dev（或等价 superpower 流程）。

权威需求：docs/specs/v1-portfolio-app/SUPERPOWER-BRIEF.md
（grilling 已确认，将 REQ/DEC 视为 confirmed，不要重新大范围选型。）

工作方式：
1. 先 scaffold docs/specs/v1-portfolio-app/ 下 requirements.md / spec.md / plan / workflow-state
   ——把本 BRIEF 结构化进 REQ-*/DEC-*/AC-*，rigor 建议 standard。
2. commit_policy: user-managed（无用户明确指示不要 commit）。
3. 执行「全删重来」前列出将删除路径，用户确认后再删（若用户已说全删，可按 BRIEF §7 执行并保留 .git）。
4. 按 Phase P0→P7 垂直交付；每 phase 结束停下来等人审，附验收步骤与证据。
5. 禁止实现 NG-*；禁止引入 Kysely、评论、搜索、AI、双轨 IaC。
6. DoD：公网 Workers + 模拟器连线上跑通 §2 剧本。

当前仓库曾有旧实现（Hono/oRPC/better-auth/D1/R2），仅作反面对照，禁止复制粘贴旧业务代码。
ORM 必须用 Drizzle。部署必须用 Alchemy。
```

---

## 10. 开放实现细节（代理可自定，不必再问用户）

- cursor vs offset 分页  
- 预签名上传 vs Worker 中转  
- likes 实时 count vs 冗余字段  
- tags 存 `text` vs `json`  
- 默认头像用本地 asset 还是 Dicebear 等公开 URL  
- HeroUI 具体组件组合与配色 token  
- page size 10 vs 20  
- 种子笔记具体文案与图片来源（注意版权：用无版权或自备图）  

**需问用户的情况：** 要动 DEC 冻结项、扩大 V1 范围、需要生产密钥/Cloudflare 账号操作授权、或删除策略与「全删」执行瞬间的最终确认。

---

## 11. 一页纸范围（钉在墙上）

```text
IN:  双列流+分页 | 详情+赞 | 单图发布 | 邮箱登录 | 我的 | 设置退出
     CF Workers+D1+R2 | oRPC | better-auth | Drizzle | Alchemy | Expo iOS/Android
OUT: 评论收藏搜索关粉推送AI | 改删笔记 | 头像上传 | 多图 | 管理后台 | 双轨IaC
DONE: 公网部署 + 模拟器打线上主路径 + 种子开箱有内容
```
