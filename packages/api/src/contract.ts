import { oc } from "@orpc/contract";
import { z } from "zod";

export const healthContract = oc.output(z.object({ ok: z.literal(true) }));

export const apiContract = {
	health: healthContract,
};
