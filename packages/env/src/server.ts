import { z } from "zod";

const defaultOrigin = "http://localhost:8081";

const commaSeparated = z.string().default("");

export const serverEnvSchema = z.object({
	BETTER_AUTH_SECRET: z.string().min(16),
	BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
	CORS_ORIGIN: z.url().default(defaultOrigin),
	CORS_ORIGINS: commaSeparated,
	SEED_SECRET: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
	source: Record<string, unknown> = process.env,
): ServerEnv {
	return serverEnvSchema.parse(source);
}

export function corsOrigins(env: ServerEnv): string[] {
	const list = env.CORS_ORIGINS.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
	return [env.CORS_ORIGIN, ...list];
}
