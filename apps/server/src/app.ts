import { RPCHandler } from "@orpc/server/fetch";
import { createAuth } from "@xhs/auth";
import { createDb } from "@xhs/db";
import { parseServerEnv } from "@xhs/env";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { imageRoutes } from "./routes/images";
import { seedRoutes } from "./routes/seed";
import { createNotesService } from "./rpc/notes-service";
import { rpcRouter } from "./rpc/router";
import type { ServerEnv } from "./types";

const localOriginPattern =
	/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;
const privateNetworkOriginPattern =
	/^https?:\/\/((10|192\.168)\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d+)?$/;

export const app = new Hono<{ Bindings: ServerEnv }>();
const rpcHandler = new RPCHandler(rpcRouter);

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
	const auth = createAuth({
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		d1: c.env.DB,
		trustedOrigins: ["xhs://", env.CORS_ORIGIN, ...env.CORS_ORIGINS.split(",")]
			.map((origin) => origin.trim())
			.filter(Boolean),
	});

	return auth.handler(c.req.raw);
});

app.use("/rpc/*", async (c) => {
	const env = parseServerEnv(c.env);
	const auth = createAuth({
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		d1: c.env.DB,
		trustedOrigins: ["xhs://", env.CORS_ORIGIN, ...env.CORS_ORIGINS.split(",")]
			.map((origin) => origin.trim())
			.filter(Boolean),
	});
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	const origin = new URL(c.req.url).origin;
	const { matched, response } = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: {
			notes: createNotesService(createDb(c.env.DB), origin),
			viewerUserId: session?.user.id ?? null,
		},
	});

	return matched ? response : c.notFound();
});

app.route("/", imageRoutes);
app.route("/", seedRoutes);
