import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "./src/dev.ts",
	format: "esm",
	outDir: "./dist",
	clean: true,
	deps: {
		alwaysBundle: [
			/@xhs\/.*/,
			/@hono\/node-server/,
			/@t3-oss\/env-core/,
			/dotenv/,
			/hono/,
			/zod/,
		],
		onlyBundle: false,
	},
	outputOptions: {
		codeSplitting: false,
	},
});
