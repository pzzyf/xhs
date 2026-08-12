import { implement, ORPCError } from "@orpc/server";
import { apiContract } from "@xhs/api";

import type { NotesService } from "./notes-service";

export type RpcContext = {
	notes: NotesService;
	viewerUserId: string | null;
};

const builder = implement(apiContract).$context<RpcContext>();

export const rpcRouter = builder.router({
	health: builder.health.handler(() => ({ ok: true as const })),
	notes: {
		list: builder.notes.list.handler(({ input, context }) =>
			context.notes.list(input),
		),
		get: builder.notes.get.handler(async ({ input, context }) => {
			const note = await context.notes.get(input.id, context.viewerUserId);
			if (!note) {
				throw new ORPCError("NOT_FOUND", { message: "笔记不存在" });
			}
			return note;
		}),
	},
});
