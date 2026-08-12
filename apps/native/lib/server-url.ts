import { getServerUrl } from "@xhs/env/native";
import { Platform } from "react-native";

const defaultServerUrl = Platform.select({
	android: "http://10.0.2.2:3000",
	default: "http://localhost:3000",
});

/**
 * 直接成员访问，供 babel-preset-expo 在构建期内联 EXPO_PUBLIC_SERVER_URL。
 * 经 getServerUrl 的默认参数 / 展开别名访问无法被静态内联（构建期取不到 .env）。
 */
const expoPublicServerUrl = process.env.EXPO_PUBLIC_SERVER_URL;

export const nativeServerUrl = (
	expoPublicServerUrl ?? getServerUrl(defaultServerUrl)
).replace(/\/$/, "");
