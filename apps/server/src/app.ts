import { Hono } from "hono";
import { cors } from "hono/cors";

export const app = new Hono();

const configuredOrigins = (
	process.env.CORS_ORIGINS ??
	process.env.CORS_ORIGIN ??
	""
)
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

const localOriginPattern =
	/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;
const privateNetworkOriginPattern =
	/^https?:\/\/((10|192\.168)\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d+)?$/;

app.use(
	"*",
	cors({
		origin: (origin) => {
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
		allowHeaders: ["Authorization", "Content-Type"],
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		maxAge: 86400,
	}),
);

app.get("/", (c) => {
	return c.text("Hello Hono!");
});
