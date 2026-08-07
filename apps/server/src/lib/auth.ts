import { expo } from "@better-auth/expo";
import { kyselyAdapter } from "@better-auth/kysely-adapter";
import type { D1Database } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { Kysely } from "kysely";
import { D1Dialect } from "kysely-d1";

import type { ServerEnv } from "../types";

export function createAuth(db: D1Database, env: ServerEnv) {
	const secret = env.BETTER_AUTH_SECRET;

	if (!secret || secret.length < 32) {
		throw new Error(
			"BETTER_AUTH_SECRET must be set and at least 32 characters",
		);
	}

	return betterAuth({
		baseURL: env.BETTER_AUTH_URL ?? "http://localhost:3000",
		database: kyselyAdapter(
			new Kysely({
				dialect: new D1Dialect({
					database: db,
				}),
			}),
		),
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
