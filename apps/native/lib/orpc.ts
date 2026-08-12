import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import type { apiContract } from "@xhs/api";
import { Platform } from "react-native";
import { authClient } from "./auth-client";
import { nativeServerUrl } from "./server-url";

const link = new RPCLink({
	url: `${nativeServerUrl}/rpc`,
	headers: () => {
		const cookie = Platform.OS === "web" ? "" : authClient.getCookie();
		return {
			"expo-origin": "xhs://",
			...(cookie ? { cookie } : {}),
		};
	},
	fetch: async (request) => {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10_000);
		const abortFromCaller = () => controller.abort();
		request.signal.addEventListener("abort", abortFromCaller, { once: true });

		try {
			return await fetch(
				new Request(request, {
					credentials: "include",
					signal: controller.signal,
				}),
			);
		} finally {
			clearTimeout(timeout);
			request.signal.removeEventListener("abort", abortFromCaller);
		}
	},
});

export const orpc: ContractRouterClient<typeof apiContract> =
	createORPCClient(link);
