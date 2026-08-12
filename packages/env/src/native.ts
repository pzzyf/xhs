import { z } from "zod";

const publicServerUrl = z.url().describe("服务端公网/开发地址");

export const nativeEnvSchema = z.object({
	EXPO_PUBLIC_SERVER_URL: publicServerUrl.default("http://localhost:3000"),
});

export type NativeEnv = z.infer<typeof nativeEnvSchema>;

export function parseNativeEnv(
	source: Record<string, unknown> = process.env,
): NativeEnv {
	return nativeEnvSchema.parse(source);
}

export function getServerUrl(
	fallback = "http://localhost:3000",
	source: Record<string, unknown> = process.env,
) {
	return parseNativeEnv({
		...source,
		EXPO_PUBLIC_SERVER_URL: source.EXPO_PUBLIC_SERVER_URL ?? fallback,
	}).EXPO_PUBLIC_SERVER_URL;
}
