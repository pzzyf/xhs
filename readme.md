# XHS

本项目使用 [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) 重构，采用 Bun、Turborepo、Expo、React Native、Hono、TanStack Query 和 Biome。

## 开始开发

```bash
bun install
bun run dev
```

原生端默认连接：

- iOS 模拟器与 Web：`http://localhost:3000`
- Android 模拟器：`http://10.0.2.2:3000`
- 真机：在 `apps/native/.env` 中配置可访问的 `EXPO_PUBLIC_SERVER_URL`

环境变量示例见 `apps/native/.env.example` 和 `apps/server/.env.example`。

## 常用命令

```bash
bun run dev
bun run dev:native
bun run dev:server
bun run check-types
bun run check
bun run build
```

## 项目结构

```text
apps/
  native/        Expo Router 原生客户端
  server/        Hono 服务端与 Lambda 入口
packages/
  config/        共享 TypeScript 配置
  env/           类型安全的客户端、服务端环境变量
```

Better-T-Stack 的可复现配置保存在 `bts.jsonc`；后续可使用 `bunx create-better-t-stack@latest add` 增加插件。
