import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import type { apiContract } from "@xhs/api";

import { apiBaseUrl, fetchWithTimeout } from "./api";

const link = new RPCLink({
	url: `${apiBaseUrl}/rpc`,
	fetch: (request, init) => fetchWithTimeout(request, init),
});

export const orpc: ContractRouterClient<typeof apiContract> =
	createORPCClient(link);
