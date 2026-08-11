import path from "node:path";
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { config } from "dotenv";
import { Config } from "effect";
import * as Effect from "effect/Effect";

// 按 Better-T-Stack 布局加载环境变量（后者覆盖前者）：
// packages/infra/.env 只放 Cloudflare 凭据与 ALCHEMY_PASSWORD，
// apps/server/.env 放服务端业务变量（BETTER_AUTH_SECRET 等）。
const infraDir = import.meta.dir;
config({ path: path.join(infraDir, ".env") });
config({ path: path.join(infraDir, "../../apps/server/.env") });

export const DB = Cloudflare.D1.Database("DB", {
	name: "xhs-d1",
	// alchemy 按进程 cwd 解析该路径，脚本固定从仓库根目录执行
	migrationsDir: "./packages/db/migrations",
});

export const IMAGES = Cloudflare.R2.Bucket("IMAGES", {
	name: "xhs-images",
});

export const Worker = Cloudflare.Worker("xhs-server", {
	name: "xhs-server",
	main: "../../apps/server/src/worker.ts",
	compatibility: {
		// 本地 workerd 二进制支持的兼容日期上限，需保持在此日期以下
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
		SEED_SECRET: Config.string("SEED_SECRET").pipe(Config.withDefault("")),
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
