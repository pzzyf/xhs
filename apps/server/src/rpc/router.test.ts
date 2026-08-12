import { describe, expect, test } from "bun:test";
import { call } from "@orpc/server";

import type { NotesService } from "./notes-service";
import { rpcRouter } from "./router";

const listResult = {
	items: [
		{
			id: "16",
			title: "周末咖啡馆打卡",
			coverUrl: "http://localhost:3000/images/seed/note-01.png",
			authorName: "体验官小艾",
			createdAt: "2026-08-12T00:00:00.000Z",
		},
	],
	nextCursor: null,
};

const detailResult = {
	id: "16",
	title: "周末咖啡馆打卡",
	coverUrl: "http://localhost:3000/images/seed/note-01.png",
	authorName: "体验官小艾",
	createdAt: "2026-08-12T00:00:00.000Z",
	body: "咖啡馆正文",
	tags: ["咖啡"],
	imageUrl: "http://localhost:3000/images/seed/note-01.png",
	likeCount: 2,
	viewerHasLiked: false,
	authorId: "author-1",
};

describe("rpc router", () => {
	test("returns the list selected by the validated input", async () => {
		const notes = {
			list: async (input) => ({
				...listResult,
				items: listResult.items.map((item) => ({
					...item,
					title: `${item.title}（${input.limit}条）`,
				})),
			}),
			get: async () => null,
			create: async () => detailResult,
			toggleLike: async () => ({ liked: true, likeCount: 1 }),
		} satisfies NotesService;

		const output = await call(
			rpcRouter.notes.list,
			{ limit: 10 },
			{ context: { notes, viewerUserId: null } },
		);

		expect(output.items[0]?.title).toBe("周末咖啡馆打卡（10条）");
		expect(output.nextCursor).toBeNull();
	});

	test("maps a missing note to NOT_FOUND", async () => {
		const notes = {
			list: async () => listResult,
			get: async () => null,
			create: async () => detailResult,
			toggleLike: async () => ({ liked: true, likeCount: 1 }),
		} satisfies NotesService;

		await expect(
			call(
				rpcRouter.notes.get,
				{ id: "999" },
				{ context: { notes, viewerUserId: null } },
			),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});

	test("returns detail selected by the id and viewer context", async () => {
		const notes = {
			list: async () => listResult,
			get: async (id, viewerUserId) => ({
				...detailResult,
				title: `${id}:${viewerUserId}`,
				viewerHasLiked: viewerUserId === "viewer-1",
			}),
			create: async () => detailResult,
			toggleLike: async () => ({ liked: true, likeCount: 1 }),
		} satisfies NotesService;

		const output = await call(
			rpcRouter.notes.get,
			{ id: "16" },
			{ context: { notes, viewerUserId: "viewer-1" } },
		);

		expect(output.title).toBe("16:viewer-1");
		expect(output.viewerHasLiked).toBeTrue();
	});

	test("forwards create input to the notes service for an authenticated viewer", async () => {
		let receivedAuthorId = "";
		const notes = {
			list: async () => listResult,
			get: async () => null,
			create: async (input, authorId) => {
				receivedAuthorId = authorId;
				return { ...detailResult, title: input.title };
			},
			toggleLike: async () => ({ liked: true, likeCount: 1 }),
		} satisfies NotesService;

		const output = await call(
			rpcRouter.notes.create,
			{
				title: "新发布",
				body: "正文",
				tags: ["咖啡"],
				imageKey: "notes/new-1.jpg",
			},
			{ context: { notes, viewerUserId: "author-1" } },
		);

		expect(output.title).toBe("新发布");
		expect(receivedAuthorId).toBe("author-1");
	});

	test("rejects create without a viewer session", async () => {
		const notes = {
			list: async () => listResult,
			get: async () => null,
			create: async () => detailResult,
			toggleLike: async () => ({ liked: true, likeCount: 1 }),
		} satisfies NotesService;

		await expect(
			call(
				rpcRouter.notes.create,
				{
					title: "新发布",
					body: "正文",
					tags: [],
					imageKey: "notes/new-1.jpg",
				},
				{ context: { notes, viewerUserId: null } },
			),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});

	test("forwards like toggle to the notes service for an authenticated viewer", async () => {
		const received = { noteId: "", userId: "" };
		const notes = {
			list: async () => listResult,
			get: async () => null,
			create: async () => detailResult,
			toggleLike: async (noteId, userId) => {
				received.noteId = noteId;
				received.userId = userId;
				return { liked: true, likeCount: 3 };
			},
		} satisfies NotesService;

		const output = await call(
			rpcRouter.likes.toggle,
			{ noteId: "16" },
			{ context: { notes, viewerUserId: "viewer-1" } },
		);

		expect(output).toEqual({ liked: true, likeCount: 3 });
		expect(received).toEqual({ noteId: "16", userId: "viewer-1" });
	});

	test("rejects like toggle without a viewer session", async () => {
		const notes = {
			list: async () => listResult,
			get: async () => null,
			create: async () => detailResult,
			toggleLike: async () => ({ liked: true, likeCount: 1 }),
		} satisfies NotesService;

		await expect(
			call(
				rpcRouter.likes.toggle,
				{ noteId: "16" },
				{ context: { notes, viewerUserId: null } },
			),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});

	test("maps a missing note to NOT_FOUND when toggling", async () => {
		const notes = {
			list: async () => listResult,
			get: async () => null,
			create: async () => detailResult,
			toggleLike: async () => null,
		} satisfies NotesService;

		await expect(
			call(
				rpcRouter.likes.toggle,
				{ noteId: "999" },
				{ context: { notes, viewerUserId: "viewer-1" } },
			),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});
