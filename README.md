# xhs

小红书风格内容社区 App（作品集向）—— Expo（iOS + Android）+ Hono on Cloudflare Workers + D1 + R2 + better-auth + oRPC + Drizzle + Alchemy，Bun monorepo（Turbo）。

> 权威需求与进度：`docs/specs/v1-portfolio-app/`（requirements / spec / plan / workflow-state）。
> 当前状态：P0–P6 已实现并验收（P3/P4/P5 里程碑 tag：`v0.4.0` / `v0.5.0` / `v0.6.0`）；P7 已部署至公网，线上验收待可访问网络/自定义域名。

## 仓库结构

```text
apps/
  native/          Expo Router 客户端（iOS + Android + Web 演示）
  server/          Hono Worker（唯一入口 src/worker.ts）
packages/
  api/             oRPC contract + Zod（Native/Server 共用契约）
  auth/            better-auth 配置工厂
  db/              Drizzle schema / migrations / seed
  env/             native + server 环境变量校验（Zod）
  infra/           alchemy.run.ts：D1 + R2 + Worker 唯一真相源
  config/          共享 tsconfig
docs/specs/v1-portfolio-app/   需求 / 规格 / 计划 / 工作流状态
```

## 技术栈

- Bun workspaces + Turborepo + Biome + Lefthook
- 客户端：Expo SDK 57（Expo Router）+ HeroUI Native + Uniwind + TanStack Query
- 服务端：Hono on Cloudflare Workers，鉴权 better-auth（邮箱+密码）
- 存储：D1（Drizzle ORM）+ R2（笔记图片）
- 部署：Alchemy（唯一 IaC 声明）

## 本地开发

前置：Bun ≥ 1.3，Cloudflare 账号凭据（部署时才需要）。

```bash
bun install

# 服务端（Alchemy 本地 runtime，D1/R2 绑定 + Worker @ :3000）
cp apps/server/.env.example apps/server/.env   # 填入 BETTER_AUTH_SECRET 等
bun run dev:server
curl http://localhost:3000/                    # 健康检查

# 种子数据（幂等：demo 用户 + 16 条中文笔记 + R2 占位图）
curl -X POST http://localhost:3000/api/dev/seed -H "x-seed-secret: <SEED_SECRET>"

# 客户端（Expo）
cp apps/native/.env.example apps/native/.env   # EXPO_PUBLIC_SERVER_URL 指向服务端
bun run dev:native                             # Web: http://localhost:8081
```

## 常用命令

```bash
bun run check-types            # 全仓类型检查（Turbo）
bun run check                  # Biome 格式化 + Lint
bunx expo install --check      #（apps/native）校验 Expo 依赖对齐
bun run alchemy:plan           # 查看 Cloudflare 资源变更计划
bun run alchemy:deploy -- --yes  # 部署 Worker + D1 + R2 到公网（非交互确认）
```

## 部署

```bash
cp packages/infra/.env.example packages/infra/.env  # Cloudflare 凭据（不入库）
cp apps/server/.env.example apps/server/.env        # BETTER_AUTH_URL 指向线上 URL
bun run alchemy:plan && bun run alchemy:deploy -- --yes
```

- 当前线上地址：`https://xhs-server.0624afe1.workers.dev`（Cloudflare 平台侧已部署：Worker + D1 + R2；D1 已应用迁移并写入种子 user=1 / notes=16）
- 注意：`*.workers.dev` 在部分网络（如中国大陆直连）不可达；如需公网验收请绑定自定义域名（Cloudflare zone）或在可访问该域名的网络下进行
- 部署后把 `apps/native/.env` 的 `EXPO_PUBLIC_SERVER_URL` 指向公网地址

## 线上验收剧本

`docs/specs/v1-portfolio-app/requirements.md` §4 的 AC-01…AC-10：本地 alchemy + Expo Web 全量走通；并已针对线上 URL 复验（经本机 HTTP 代理访问公网 Worker；Web 会话经同源面纱 + Cookie 翻译完成），注册/发布/点赞/我的/设置/退出全绿、控制台 0 error。Android 模拟器（Expo Go）已启动并打到同一线上 API：原生注册（线上 D1 账号 AndroidFinal）、点赞/取消（3→4→3）、我的、设置退出均已录证；服务端已放行 `exp://` origin。原生发布录证与 iOS 模拟器待补。注意：直连 `*.workers.dev` 在部分网络不可达，验收需代理或自定义域名。

## 安全与约定

- 真密钥只放各 `.env`（已 gitignore），仅提交 `.env.example`
- 禁止把密钥放进 `EXPO_PUBLIC_*`
- 提交由用户显式发起；不 force push；不绕过 Lefthook hooks
- 不引入 Kysely / 评论 / 搜索 / AI / 双轨 IaC（详见需求非目标）
