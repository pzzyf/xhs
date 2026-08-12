import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import type { apiContract } from "@xhs/api";
import { Platform } from "react-native";
import { authClient } from "./auth-client";
import { fetchWithTimeout } from "./fetch-with-timeout";
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
	fetch: (request) => fetchWithTimeout(request),
});

export const orpc: ContractRouterClient<typeof apiContract> =
	createORPCClient(link);
