import { parseServerEnv } from "@xhs/env";
import { Hono } from "hono";
import type { ServerEnv } from "../types";

/**
 * 开发种子图片上传（spec 2026-08-12）：仅当 SEED_SECRET 已配置时生效。
 * 用途：把仓库内精选真实照片（packages/db/seed-photos）写入 R2，
 * key 限 `seed/` 前缀；本地（alchemy dev）与线上通用。
 */
export const seedImageRoutes = new Hono<{ Bindings: ServerEnv }>();

const MAX_SEED_IMAGE_BYTES = 8 * 1024 * 1024;
const SEED_KEY_PATTERN = /^seed\/[\w.-]+(\/[\w.-]+)*$/;

seedImageRoutes.put("/api/dev/seed/images/:key", async (c) => {
	const env = parseServerEnv(c.env);
	if (!env.SEED_SECRET) {
		return c.json({ ok: false, error: "种子接口未启用" }, 404);
	}
	if (c.req.header("x-seed-secret") !== env.SEED_SECRET) {
		return c.json({ ok: false, error: "种子密钥不正确" }, 401);
	}

	const key = c.req.param("key") ?? "";
	if (!SEED_KEY_PATTERN.test(key)) {
		return c.json(
			{ ok: false, error: "key 必须以 seed/ 开头且仅含字母数字与连字符" },
			400,
		);
	}

	const declaredLength = Number(c.req.header("content-length") ?? 0);
	if (declaredLength > MAX_SEED_IMAGE_BYTES) {
		return c.json({ ok: false, error: "图片过大" }, 413);
	}

	const body = await c.req.arrayBuffer();
	if (body.byteLength > MAX_SEED_IMAGE_BYTES) {
		return c.json({ ok: false, error: "图片过大" }, 413);
	}

	const contentType =
		c.req.header("content-type") ?? "application/octet-stream";
	await c.env.IMAGES.put(key, body, { httpMetadata: { contentType } });

	return c.json({ ok: true, key, bytes: body.byteLength });
});
