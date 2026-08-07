import { implement } from "@orpc/server";
import { apiContract } from "@xhs/api";

const os = implement(apiContract);

export const ping = os.ping.handler(async () => "pong");

export const greeting = os.greeting.handler(async ({ input }) => {
	return `Hello, ${input.name ?? "ORPC"}!`;
});

export const rpcRouter = os.router({
	greeting,
	ping,
});
