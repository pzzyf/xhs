import { expoClient } from "@better-auth/expo/client";
import type { ClientStore } from "better-auth/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { apiBaseUrl } from "./api";

const webStorage = {
	getItem: (key: string) =>
		typeof localStorage === "undefined" ? null : localStorage.getItem(key),
	setItem: (key: string, value: string) => {
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(key, value);
		}
	},
};

const storage = Platform.OS === "web" ? webStorage : SecureStore;

// @better-auth/expo 1.6.26 的 getActions 类型与 better-auth core
// 存在上游发布错位（BetterFetch 参数不兼容）。把该参数放宽为 unknown，
// 保留其余插件字段的原始类型，避免丢失客户端 API 的类型推断。
const baseExpoPlugin = expoClient({
	scheme: "xhs",
	storage,
	storagePrefix: "xhs",
});
const expoPlugin = {
	...baseExpoPlugin,
	getActions: (fetch: unknown, store: ClientStore) =>
		baseExpoPlugin.getActions(fetch as never, store),
};

export const authClient = createAuthClient({
	baseURL: `${apiBaseUrl}/api/auth`,
	fetchOptions: {
		credentials: "include",
	},
	plugins: [expoPlugin],
});

export async function clearAuthTokenStorage() {
	const keys = ["xhs_cookie", "xhs_session_data"];

	if (Platform.OS === "web") {
		if (typeof localStorage === "undefined") {
			return;
		}

		for (const key of keys) {
			localStorage.removeItem(key);
		}
		return;
	}

	for (const key of keys) {
		try {
			await SecureStore.deleteItemAsync(key);
		} catch {
			// 忽略清理失败，服务端会话已由 sign-out 失效。
		}
	}
}
