import {
	createDb,
	DEMO_PASSWORD,
	DEMO_USER_ID,
	runSeed,
	SEED_NOTES,
	seedImageBytes,
} from "@xhs/db";
import { account } from "@xhs/db/schema";
import { parseServerEnv } from "@xhs/env";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { ServerEnv } from "../types";

/**
 * 开发种子接口（spec §2.6）：仅当 SEED_SECRET 已配置时生效。
 * 幂等：图片已存在跳过上传；demo 用户 + 笔记已存在跳过写入；
 * demo 凭证账号（邮箱+密码登录）缺失时补齐（2026-08-12）。
 */
export const seedRoutes = new Hono<{ Bindings: ServerEnv }>();

async function ensureDemoCredential(db: ReturnType<typeof createDb>) {
	const [existing] = await db
		.select({ id: account.id })
		.from(account)
		.where(
			and(
				eq(account.userId, DEMO_USER_ID),
				eq(account.providerId, "credential"),
			),
		)
		.limit(1);
	if (existing) {
		return false;
	}

	const now = new Date();
	const password = await hashPassword(DEMO_PASSWORD);
	await db.insert(account).values({
		id: `seed_account_${DEMO_USER_ID}`,
		accountId: DEMO_USER_ID,
		providerId: "credential",
		userId: DEMO_USER_ID,
		password,
		createdAt: now,
		updatedAt: now,
	});
	return true;
}

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
	const credentialCreated = await ensureDemoCredential(db);
	return c.json({
		...result,
		imagesUploaded: uploaded,
		credentialCreated,
	});
});
