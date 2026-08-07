import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { expo } from "@better-auth/expo";
import { env } from "@xhs/env/server";
import { betterAuth } from "better-auth";

const serverRoot = fileURLToPath(new URL("../..", import.meta.url));
const databasePath = join(serverRoot, "data", "better-auth.sqlite");

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	database: new DatabaseSync(databasePath),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [expo()],
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins: [
		"http://localhost:8081",
		"http://localhost:3000",
		"xhs://",
		...((env.NODE_ENV === "development"
			? ["exp://", "exp://**", "exp://192.168.*.*:*/**", "exp://10.*.*.*:*/**"]
			: []) as string[]),
	],
});
