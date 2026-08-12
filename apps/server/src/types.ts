import type { D1Database, Fetcher, R2Bucket } from "@cloudflare/workers-types";

export type ServerEnv = {
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	CORS_ORIGIN: string;
	CORS_ORIGINS: string;
	SEED_SECRET: string;
	DB: D1Database;
	IMAGES: R2Bucket;
	/** 静态资源绑定（同源托管 Web 产物时注入；未配置时为空） */
	ASSETS?: Fetcher;
};
