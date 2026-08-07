import { expo } from "@better-auth/expo";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import type { D1Database } from "@cloudflare/workers-types";
import { createDb } from "@xhs/db";
import { betterAuth } from "better-auth";

export type AuthEnv = {
	BETTER_AUTH_SECRET?: string;
	BETTER_AUTH_URL?: string;
	NODE_ENV?: string;
};

export function createAuth(db: D1Database, env: AuthEnv) {
	const secret = env.BETTER_AUTH_SECRET;

	if (!secret || secret.length < 32) {
		throw new Error(
			"BETTER_AUTH_SECRET must be set and at least 32 characters",
		);
	}

	return betterAuth({
		baseURL: env.BETTER_AUTH_URL ?? "http://localhost:3000",
		database: kyselyAdapter(createDb(db)),
		emailAndPassword: {
			enabled: true,
			minPasswordLength: 6,
		},
		plugins: [expo()],
		secret,
		trustedOrigins: [
			"http://localhost:8081",
			"http://localhost:3000",
			"xhs://",
			...((env.NODE_ENV === "development"
				? [
						"exp://",
						"exp://**",
						"exp://192.168.*.*:*/**",
						"exp://10.*.*.*:*/**",
					]
				: []) as string[]),
		],
	});
}
