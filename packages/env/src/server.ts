import "dotenv/config";

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		CORS_ORIGIN: z.url().optional(),
		CORS_ORIGINS: z.string().optional(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		PORT: z.coerce.number().int().min(1).max(65_535).optional(),
	},
	runtimeEnv: process.env,
	skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
	emptyStringAsUndefined: true,
});
