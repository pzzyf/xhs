import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

import { rpcRouter } from "./router";

export const rpcHandler = new RPCHandler(rpcRouter, {
	interceptors: [
		onError((error) => {
			console.error("[orpc]", error);
		}),
	],
});
