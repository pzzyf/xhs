import { Hono } from "hono";
import type { ServerEnv } from "../types";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const imageExtensions: Record<string, string> = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
	"image/gif": "gif",
};

export type SessionResolver = (
	headers: Headers,
	env: ServerEnv,
) => Promise<string | null>;

export function createUploadRoutes(resolveUserId: SessionResolver) {
	const routes = new Hono<{
		Bindings: ServerEnv;
		Variables: { userId: string };
	}>();

	routes.use("/api/images", async (c, next) => {
		const userId = await resolveUserId(c.req.raw.headers, c.env);
		if (!userId) {
			return c.json({ ok: false, error: "请先登录" }, 401);
		}
		c.set("userId", userId);
		await next();
	});

	routes.put("/api/images", async (c) => {
		const contentType = c.req.header("content-type") ?? "";
		const mediaType = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
		if (!mediaType.startsWith("image/")) {
			return c.json({ ok: false, error: "仅支持图片上传" }, 400);
		}

		const body = await c.req.arrayBuffer();
		if (body.byteLength === 0) {
			return c.json({ ok: false, error: "图片内容为空" }, 400);
		}
		if (body.byteLength > MAX_IMAGE_BYTES) {
			return c.json({ ok: false, error: "图片过大（最大 10MB）" }, 413);
		}

		const extension = imageExtensions[mediaType] ?? "png";
		const imageKey = `notes/${crypto.randomUUID()}.${extension}`;
		await c.env.IMAGES.put(imageKey, body, {
			httpMetadata: { contentType: mediaType },
		});

		return c.json({
			ok: true,
			imageKey,
			imageUrl: `/images/${imageKey}`,
		});
	});

	return routes;
}
