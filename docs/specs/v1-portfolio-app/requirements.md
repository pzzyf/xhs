# V1 作品集 App — 需求（Requirements）

> 来源：`SUPERPOWER-BRIEF.md`（grilling 冻结，2026-08-11）。REQ/DEC 视为已确认，不做重新选型。
> 本文把 BRIEF 结构化进 REQ-\* / DEC-\* / NG-\* / AC-\*，规格与计划的唯一需求入口。

## 1. 产品需求（REQ）

| ID | 需求 | 验收要点（AC） |
|----|------|----------------|
| REQ-01 | 个人作品集 Demo：90 秒内像「真 App」，产品完成度优先于工程炫技 | AC-01：冷启动即可浏览完整主路径 |
| REQ-02 | 主路径可演示；边角 case 允许硬编码/种子 | — |
| REQ-03 | 客户端 Expo，iOS + Android 模拟器都能跑（真机非必须） | AC-03：两端启动并打到同一线上 API |
| REQ-04 | 真后端：自有 API + DB，App 不写死业务列表数据 | AC-04：信息流/详情数据均来自 API |
| REQ-05 | 后端跑在 Cloudflare Workers，有公网 URL | AC-05：`GET /` 健康检查可从公网访问 |
| REQ-06 | 存储 D1（SQL）+ R2（图片） | AC-06：种子与用户笔记图片均存 R2 |
| REQ-07 | better-auth 邮箱+密码；未登录可直接浏览首页 | AC-07：未登录冷启动直达首页信息流 |
| REQ-08 | oRPC + 共享 Zod 契约（monorepo 内端到端类型） | AC-08：Native 与 Server 共用 `packages/api` 契约 |
| REQ-09 | Bun monorepo（apps/native + apps/server + packages/*，Turbo） | AC-09：根目录 `bun run check-types` 通过 |
| REQ-10 | 双列瀑布流 + 无限滚动，封面比例接近内容社区 | AC-10：上拉加载下一页，无滚动跳动 |
| REQ-11 | 发布：单图真上传 R2 + 标题 + 正文 + 标签字段 | AC-11：提交后信息流与「我的」可见，图来自 R2 |
| REQ-12 | 详情：大图 + 标题 + 正文 + 作者昵称 + 点赞（总数 + 是否已赞） | AC-12：未登录显示计数，登录后显示赞态 |
| REQ-13 | 点赞需登录；一人一赞可取消；仅详情页展示赞态/计数，列表不显示 | AC-13：toggle 幂等，+1/-1 正确 |
| REQ-14 | 我的主页：默认头像 + 昵称 + 我发布的笔记列表 | AC-14：未登录引导登录或空态；已登录仅看自己 |
| REQ-15 | 设置：展示当前昵称/头像占位 + 退出登录 | AC-15：退出后可继续浏览，写操作再次要求登录 |
| REQ-16 | 底部两 Tab「首页 \| 我的」；发布为首页/导航栏按钮，不占 Tab | AC-16：Tab 仅两个，发布入口在首页顶部 |
| REQ-17 | 未登录点「发布/赞」→ 跳转登录页；登录成功一律回首页 | AC-17：登录成功固定回 `/` |
| REQ-18 | 首页信息流与登录态无关（同一套公开内容） | AC-18：登录前后列表内容一致 |
| REQ-19 | 种子数据：脚本写入示例笔记 + 可注册真实账号；开箱首页有内容 | AC-19：种子 ≥ 1.5 页（page size 10） |
| REQ-20 | UI 文案仅中文；视觉现代干净，不抄小红书品牌资产/商标红 | AC-20：无商标红/Logo 仿冒，全中文文案 |
| REQ-21 | 部署轨：Alchemy 唯一声明与部署 Cloudflare 资源；不维护第二套平行 IaC | AC-21：仓库内无 wrangler.jsonc 等平行资源声明 |
| REQ-22 | 技术栈锁定见 DEC | — |

## 2. 非目标（NG，V1 禁止实现）

| ID | 内容 |
|----|------|
| NG-01 | 评论 |
| NG-02 | 收藏 |
| NG-03 | 搜索 |
| NG-04 | 关注/粉丝 |
| NG-05 | 推送通知 |
| NG-06 | 任何 AI 能力 |
| NG-07 | 笔记编辑/删除 |
| NG-08 | 用户头像上传（仅默认占位图） |
| NG-09 | 多图发布 |
| NG-10 | 标签筛选/标签详情页（标签可存，UI 不强调） |
| NG-11 | 独立 Web 管理后台 / TanStack Router Web App |
| NG-12 | AWS Lambda / Node 长期双运行时（本地脚本可极简，不以 Lambda 交付） |
| NG-13 | Wrangler 与 Alchemy 双轨并行维护两套资源真相源 |
| NG-14 | 从旧代码 copy-paste 大段业务实现 |
| NG-15 | 公司项目代码/资源/密钥任何复用 |
| NG-16 | 国际化、改密、邮箱验证、手机号登录 |
| NG-17 | 登录后恢复原操作（V1 固定回首页） |

## 3. 技术决策（DEC，已冻结）

| ID | 决策 | 备注 |
|----|------|------|
| DEC-01 | Bun workspaces + Turborepo | 根目录编排 |
| DEC-02 | apps/native：Expo Router + RN 新版稳定 SDK | `expo install` 对齐版本 |
| DEC-03 | UI：HeroUI Native + Uniwind；保持一种主风格 | 神韵向，中文 |
| DEC-04 | 数据请求：TanStack Query（含 AppState focus / NetInfo online，非 Web） | 使用 native-data-fetch Skill |
| DEC-05 | apps/server：Hono 跑在 CF Workers | 入口与 binding 由 Alchemy 管理 |
| DEC-06 | ORM：Drizzle + D1（不用 Kysely） | |
| DEC-07 | 对象存储：R2 | 笔记封面图 |
| DEC-08 | 契约：packages/api oRPC contract + Zod | Native/Server 共用 |
| DEC-09 | 鉴权：packages/auth better-auth（邮箱密码）+ Expo 客户端 | 会话安全存储 |
| DEC-10 | 环境变量：packages/env（t3-env 或等价 Zod） | 禁止密钥进 EXPO_PUBLIC_\* |
| DEC-11 | 格式化/Lint：Biome | |
| DEC-12 | 基础设施：packages/infra + Alchemy（D1+R2+Worker 单一真相源） | |
| DEC-13 | 包管理：Bun；不手改 lock 以外手段 | |
| DEC-14 | 类型：严格 TypeScript；共享 tsconfig 在 packages/config | |

## 4. 验收剧本（AC，来自 BRIEF §2，全部走线上 API）

| # | 剧本步骤 | 通过标准 |
|---|----------|----------|
| AC-01 | 冷启动未登录 → 首页 → 种子双列瀑布流 → 上拉加载更多 | 首页有内容，翻页正常 |
| AC-02 | 点卡片 → 详情：大图、标题、正文、作者昵称、赞按钮与计数 | 未登录显示计数 |
| AC-03 | 点赞（未登录）→ 跳转登录页 | 跳转 `/sign-in` |
| AC-04 | 注册（邮箱+密码+昵称）→ 成功后回首页 | 回 `/` |
| AC-05 | 再进同一详情 → 点赞 → 计数 +1、已赞态；再点取消 → 计数 -1 | toggle 正确 |
| AC-06 | 首页点发布（已登录）→ 选 1 张图 → 标题/正文/标签 → 提交 → 信息流/我的可见 | 图来自 R2 |
| AC-07 | 上传失败 → Toast 错误，可重新走发布 | 不要求断点续传 |
| AC-08 | 我的 → 默认头像 + 昵称 + 我的笔记列表 → 可进详情 | 仅自己 |
| AC-09 | 设置 → 昵称/默认头像 → 退出 → 可继续浏览首页，写操作再要求登录 | 退出语义正确 |
| AC-10 | `GET /` 健康检查从公网可访问；EXPO_PUBLIC_SERVER_URL 指向该部署 | 公网可达 |

**DoD（完成线）**：Workers 已部署公网 + iOS/Android 模拟器连接线上 API 完整走通主路径；开箱有种子内容。仅本地通过称 **implemented**，不可称 **deployed**。

## 5. 权限矩阵

| 动作 | 未登录 | 已登录 |
|------|--------|--------|
| 浏览信息流/详情 | ✅ | ✅ |
| 点赞/取消 | ❌ → 登录页 | ✅ |
| 发布 | ❌ → 登录页 | ✅ |
| 看我的笔记 | 可进「我的」但引导登录或空态 | ✅ 仅自己 |
| 改/删笔记 | — | ❌ V1 无 |
| 改资料/头像 | — | ❌ V1 无 |

无服务端游客用户、无匿名 session。「游客」= 未登录浏览。
