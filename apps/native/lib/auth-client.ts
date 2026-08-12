import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { nativeServerUrl } from "./server-url";

const expoPlugin = expoClient({
	scheme: "xhs",
	storagePrefix: "xhs",
	storage: SecureStore,
});

const authClientOptions = {
	baseURL: nativeServerUrl,
	plugins: [expoPlugin],
} as const;

// 1.6.26 的 Expo 插件声明与 TS 6 的 BetterFetch 泛型存在方差误报；
// 运行时依赖版本已锁定一致；上游修复后该指令会触发未使用错误。
// @ts-expect-error @better-auth/expo 1.6.26 与 TS 6 BetterFetch 泛型方差不兼容
const baseAuthClient = createAuthClient(authClientOptions);

type ExpoActions = ReturnType<typeof expoPlugin.getActions>;

export const authClient = baseAuthClient as typeof baseAuthClient & ExpoActions;
