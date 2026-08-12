import { expoClient } from "@better-auth/expo/client";
import { getServerUrl } from "@xhs/env/native";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const defaultServerUrl = Platform.select({
	android: "http://10.0.2.2:3000",
	default: "http://localhost:3000",
});

export const authClient = createAuthClient({
	baseURL: getServerUrl(defaultServerUrl).replace(/\/$/, ""),
	plugins: [
		// 1.6.26 的 Expo 插件声明与 TS 6 的 BetterFetch 泛型存在方差误报；
		// 运行时依赖版本已锁定一致；上游修复后该指令会触发未使用错误。
		// @ts-expect-error @better-auth/expo 1.6.26 与 TS 6 BetterFetch 泛型方差不兼容
		expoClient({
			scheme: "xhs",
			storagePrefix: "xhs",
			storage: SecureStore,
		}),
	],
});
