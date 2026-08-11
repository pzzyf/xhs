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

export const getServerUrl = () => parseNativeEnv().EXPO_PUBLIC_SERVER_URL;
