import { expo } from "@better-auth/expo";
import type { D1Database } from "@cloudflare/workers-types";
import { createDb } from "@xhs/db";
import * as schema from "@xhs/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export interface CreateAuthOptions {
	secret: string;
	baseURL: string;
	d1: D1Database;
	trustedOrigins?: string[];
}

/** better-auth 配置工厂（spec §2.7）：Drizzle adapter + D1，邮箱密码登录 */
export function createAuth({
	secret,
	baseURL,
	d1,
	trustedOrigins = ["xhs://"],
}: CreateAuthOptions) {
	return betterAuth({
		secret,
		baseURL,
		basePath: "/api/auth",
		trustedOrigins,
		database: drizzleAdapter(createDb(d1), {
			provider: "sqlite",
			schema,
			camelCase: true,
			// D1 不支持 adapter 事务，顺序执行
			transaction: false,
		}),
		emailAndPassword: {
			enabled: true,
		},
		plugins: [expo()],
	});
}

export type Auth = ReturnType<typeof createAuth>;
