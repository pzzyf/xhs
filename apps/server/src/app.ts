import { createAuth } from "@xhs/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { rpcHandler } from "./rpc";
import type { ServerEnv } from "./types";

const localOriginPattern =
	/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;
const privateNetworkOriginPattern =
	/^https?:\/\/((10|192\.168)\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d+)?$/;

export const app = new Hono<{ Bindings: ServerEnv }>();

app.use(logger());
app.use(
	"*",
	cors({
		origin: (origin, c) => {
			const configuredOrigins = (c.env.CORS_ORIGINS ?? c.env.CORS_ORIGIN ?? "")
				.split(",")
				.map((item: string) => item.trim())
				.filter(Boolean);

			if (configuredOrigins.includes("*")) {
				return "*";
			}

			if (
				configuredOrigins.includes(origin) ||
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
			"X-Requested-With",
			"expo-origin",
			"x-skip-oauth-proxy",
		],
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		credentials: true,
		maxAge: 86400,
	}),
);

app.use("/rpc/*", async (c, next) => {
	const { matched, response } = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: {},
	});

	if (matched) {
		return c.newResponse(response.body, response);
	}

	await next();
});

app.on(["POST", "GET"], "/api/auth/*", (c) =>
	createAuth(c.env.DB, c.env).handler(c.req.raw),
);

app.get("/", (c) => {
	return c.text("Hello Hono!");
});
