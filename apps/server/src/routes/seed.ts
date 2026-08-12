import { createDb, runSeed, SEED_NOTES, seedImageBytes } from "@xhs/db";
import { parseServerEnv } from "@xhs/env";
import { Hono } from "hono";
import type { ServerEnv } from "../types";

/**
 * 开发种子接口（spec §2.6）：仅当 SEED_SECRET 已配置时生效。
 * 幂等：图片已存在跳过上传；demo 用户 + 笔记已存在跳过写入。
 */
export const seedRoutes = new Hono<{ Bindings: ServerEnv }>();

seedRoutes.post("/api/dev/seed", async (c) => {
	const env = parseServerEnv(c.env);
	if (!env.SEED_SECRET) {
		return c.json({ ok: false, error: "种子接口未启用" }, 404);
	}
	if (c.req.header("x-seed-secret") !== env.SEED_SECRET) {
		return c.json({ ok: false, error: "种子密钥不正确" }, 401);
	}

	let uploaded = 0;
	for (let i = 0; i < SEED_NOTES.length; i++) {
		const note = SEED_NOTES[i];
		if (!note) continue;
		const existing = await c.env.IMAGES.head(note.imageKey);
		if (existing) continue;
		await c.env.IMAGES.put(note.imageKey, seedImageBytes(i), {
			httpMetadata: { contentType: "image/png" },
		});
		uploaded += 1;
	}

	const db = createDb(c.env.DB);
	const result = await runSeed(db);
	return c.json({ ...result, imagesUploaded: uploaded });
});
