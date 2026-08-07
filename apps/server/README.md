# Hono 服务端

```bash
bun install
bun run dev
```

默认地址：`http://localhost:3000`

如果 `3000` 被占用，开发服务会自动使用下一个可用端口。

复制 `.env.example` 为 `.env` 可以固定端口或配置 CORS（Cloudflare 凭据另见 `packages/infra/.env.example`）。构建产物同时包含 Node.js 开发入口 `dist/dev.mjs` 和 AWS Lambda 入口 `dist/index.mjs`。

Cloudflare 的配置（Wrangler 与 Alchemy）统一放在 `packages/infra`，见根目录 [README](../README.md)。
