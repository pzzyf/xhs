import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

export type ServerEnv = {
	BETTER_AUTH_SECRET?: string;
	BETTER_AUTH_URL?: string;
	CORS_ORIGIN?: string;
	CORS_ORIGINS?: string;
	DB: D1Database;
	IMAGES: R2Bucket;
	NODE_ENV?: string;
};
