import { implement } from "@orpc/server";
import { rpcContract } from "@xhs/rpc";

const os = implement(rpcContract);

export const ping = os.ping.handler(async () => "pong");

export const greeting = os.greeting.handler(async ({ input }) => {
	return `Hello, ${input.name ?? "ORPC"}!`;
});

export const rpcRouter = os.router({
	greeting,
	ping,
});
