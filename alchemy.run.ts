import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Config } from "effect";
import * as Effect from "effect/Effect";

export const DB = Cloudflare.D1.Database("DB", {
	name: "xhs-d1",
	migrationsDir: "./apps/server/migrations",
});

export const IMAGES = Cloudflare.R2.Bucket("IMAGES", {
	name: "xhs-images",
});

export const Worker = Cloudflare.Worker("xhs-server", {
	name: "xhs-server",
	main: "./apps/server/src/worker.ts",
	compatibility: {
		// 本地 workerd 二进制支持的兼容日期上限为 2026-07-11，需保持在此日期以下
		date: "2026-07-11",
		flags: ["nodejs_compat"],
	},
	dev: {
		port: 3000,
	},
	env: {
		BETTER_AUTH_SECRET: Config.redacted("BETTER_AUTH_SECRET"),
		BETTER_AUTH_URL: Config.string("BETTER_AUTH_URL").pipe(
			Config.withDefault("http://localhost:3000"),
		),
		CORS_ORIGIN: Config.string("CORS_ORIGIN").pipe(
			Config.withDefault("http://localhost:8081"),
		),
		CORS_ORIGINS: Config.string("CORS_ORIGINS").pipe(Config.withDefault("")),
		NODE_ENV: Config.string("NODE_ENV").pipe(Config.withDefault("development")),
		DB,
		IMAGES,
	},
});

export type WorkerEnv = Cloudflare.InferEnv<typeof Worker>;

export default Alchemy.Stack(
	"XhsServer",
	{
		providers: Cloudflare.providers(),
		state: Cloudflare.state(),
	},
	Effect.gen(function* () {
		const worker = yield* Worker;

		return { url: worker.url.as<string>() };
	}),
);
