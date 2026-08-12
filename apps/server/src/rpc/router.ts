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
		create: builder.notes.create.handler(async ({ input, context }) => {
			if (!context.viewerUserId) {
				throw new ORPCError("UNAUTHORIZED", { message: "请先登录" });
			}
			return context.notes.create(input, context.viewerUserId);
		}),
	},
	likes: {
		toggle: builder.likes.toggle.handler(async ({ input, context }) => {
			if (!context.viewerUserId) {
				throw new ORPCError("UNAUTHORIZED", { message: "请先登录" });
			}
			const result = await context.notes.toggleLike(
				input.noteId,
				context.viewerUserId,
			);
			if (!result) {
				throw new ORPCError("NOT_FOUND", { message: "笔记不存在" });
			}
			return result;
		}),
	},
	me: {
		notes: builder.me.notes.handler(async ({ context }) => {
			if (!context.viewerUserId) {
				throw new ORPCError("UNAUTHORIZED", { message: "请先登录" });
			}
			return context.notes.listMine(context.viewerUserId);
		}),
		profile: builder.me.profile.handler(async ({ context }) => {
			if (!context.viewerUserId) {
				throw new ORPCError("UNAUTHORIZED", { message: "请先登录" });
			}
			const profile = await context.notes.getProfile(context.viewerUserId);
			if (!profile) {
				throw new ORPCError("NOT_FOUND", { message: "用户不存在" });
			}
			return profile;
		}),
	},
});
