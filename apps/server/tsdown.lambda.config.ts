import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "./src/index.ts",
	format: "esm",
	outDir: "./dist",
	clean: false,
	deps: {
		alwaysBundle: [/@xhs\/.*/, /@t3-oss\/env-core/, /dotenv/, /hono/, /zod/],
		onlyBundle: false,
	},
	outputOptions: {
		codeSplitting: false,
	},
});
