import { oc } from "@orpc/contract";
import { z } from "zod";

export const pingContract = oc.output(z.string());

export const greetingContract = oc
	.input(
		z.object({
			name: z.string().trim().min(1).max(50).optional(),
		}),
	)
	.output(z.string());

export const rpcContract = {
	greeting: greetingContract,
	ping: pingContract,
};
