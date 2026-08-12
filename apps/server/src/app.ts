import { RPCHandler } from "@orpc/server/fetch";
import { createDb } from "@xhs/db";
import { parseServerEnv } from "@xhs/env";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createAppAuth, resolveSessionUserId } from "./auth";
import { imageRoutes } from "./routes/images";
import { seedRoutes } from "./routes/seed";
import { seedImageRoutes } from "./routes/seed-images";
import { createUploadRoutes } from "./routes/upload";
import { createNotesService } from "./rpc/notes-service";
import { rpcRouter } from "./rpc/router";
import type { ServerEnv } from "./types";

const localOriginPattern =
	/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;
const privateNetworkOriginPattern =
	/^https?:\/\/((10|192\.168)\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d+)?$/;

export const app = new Hono<{ Bindings: ServerEnv }>();
const rpcHandler = new RPCHandler(rpcRouter);
const uploadRoutes = createUploadRoutes((headers, env) => {
	const parsed = parseServerEnv(env);
	return resolveSessionUserId(parsed, env.DB, headers);
});

app.use(logger());
app.use(
	"*",
	cors({
		origin: (origin, c) => {
			const parsed = parseServerEnv(c.env);
			const configuredOrigins = parsed.CORS_ORIGINS.split(",")
				.map((item: string) => item.trim())
				.filter(Boolean);
			const allowed = [...configuredOrigins, parsed.CORS_ORIGIN];

			if (
				allowed.includes(origin) ||
				localOriginPattern.test(origin) ||
				privateNetworkOriginPattern.test(origin)
			) {
				return origin;
			}

			return undefined;
		},
		allowHeaders: [
			"Authorization",
			"Content-Type",
			"Cookie",
			"Expo-Origin",
			"X-Skip-OAuth-Proxy",
		],
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		exposeHeaders: ["Set-Cookie"],
		credentials: true,
		maxAge: 86400,
	}),
);

app.get("/", (c) =>
	c.json({
		ok: true,
		name: "xhs-server",
		time: new Date().toISOString(),
	}),
);

app.on(["GET", "POST"], "/api/auth/*", (c) => {
	const env = parseServerEnv(c.env);
	const auth = createAppAuth(env, c.env.DB);

	return auth.handler(c.req.raw);
});

app.use("/rpc/*", async (c) => {
	const env = parseServerEnv(c.env);
	const viewerUserId = await resolveSessionUserId(
		env,
		c.env.DB,
		c.req.raw.headers,
	);
	const origin = new URL(c.req.url).origin;
	const { matched, response } = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: {
			notes: createNotesService(createDb(c.env.DB), origin),
			viewerUserId,
		},
	});

	return matched ? response : c.notFound();
});

app.route("/", imageRoutes);
app.route("/", seedRoutes);
app.route("/", seedImageRoutes);
app.route("/", uploadRoutes);

// SPA 兜底（同源托管 Web 静态产物）：未匹配的 GET 深链（如 /note/123）
// 返回 index.html 交给客户端路由；无 ASSETS 绑定（如纯 API 部署）时返回 404。
// 注：ASSETS.fetch 返回 workers 类型 Response，需复制为 DOM Response 再返回。
app.get("*", async (c) => {
	if (!c.env.ASSETS) {
		return c.notFound();
	}

	const assetResponse = await c.env.ASSETS.fetch(
		new Request(new URL("/index.html", c.req.url)),
	);
	if (assetResponse.status !== 200) {
		return c.notFound();
	}

	return new Response(assetResponse.body, {
		status: assetResponse.status,
		headers: assetResponse.headers,
	});
});
