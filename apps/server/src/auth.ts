import type { D1Database } from "@cloudflare/workers-types";
import { createAuth } from "@xhs/auth";

type AuthVars = {
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	CORS_ORIGIN: string;
	CORS_ORIGINS: string;
};

export function createAppAuth(vars: AuthVars, db: D1Database) {
	return createAuth({
		secret: vars.BETTER_AUTH_SECRET,
		baseURL: vars.BETTER_AUTH_URL,
		d1: db,
		trustedOrigins: [
			"xhs://",
			vars.CORS_ORIGIN,
			...vars.CORS_ORIGINS.split(","),
		]
			.map((origin) => origin.trim())
			.filter(Boolean),
	});
}

export async function resolveSessionUserId(
	vars: AuthVars,
	db: D1Database,
	headers: Headers,
): Promise<string | null> {
	const auth = createAppAuth(vars, db);
	const session = await auth.api.getSession({ headers });
	return session?.user.id ?? null;
}
