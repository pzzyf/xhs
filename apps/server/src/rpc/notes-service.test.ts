import { describe, expect, test } from "bun:test";
import type { D1Database } from "@cloudflare/workers-types";
import { createDb } from "@xhs/db";

import { createNotesService } from "./notes-service";

type FakeUser = { id: string; name: string };
type FakeNote = {
	id: number;
	authorId: string;
	title: string;
	body: string;
	tags: string;
	imageKey: string;
	createdAt: number;
};
type FakeLike = { noteId: number; userId: string };

class FakeD1 {
	constructor(
		private readonly users: FakeUser[],
		private readonly notes: FakeNote[],
		private readonly likes: FakeLike[],
	) {}

	prepare(sql: string) {
		return new FakeD1Statement(sql, [], (query, params) =>
			this.execute(query, params),
		);
	}

	private execute(sql: string, params: unknown[]): unknown[][] {
		if (sql.includes('insert into "notes"')) {
			const [authorId, title, body, tags, imageKey, createdAt] = params;
			const nextId = Math.max(0, ...this.notes.map((note) => note.id)) + 1;
			this.notes.push({
				id: nextId,
				authorId: String(authorId),
				title: String(title),
				body: String(body),
				tags: String(tags),
				imageKey: String(imageKey),
				createdAt: Number(createdAt),
			});
			return [[nextId]];
		}

		if (sql.includes('from "notes" inner join "user"')) {
			if (sql.includes('"notes"."body"')) {
				const note = this.notes.find(({ id }) => id === Number(params[0]));
				if (!note) return [];
				const author = this.users.find(({ id }) => id === note.authorId);
				if (!author) return [];

				return [
					[
						note.id,
						note.title,
						note.body,
						note.tags,
						note.imageKey,
						note.createdAt,
						author.id,
						author.name,
					],
				];
			}

			const hasCursor = sql.includes('where "notes"."id" < ?');
			const cursor = hasCursor ? Number(params[0]) : undefined;
			const limit = Number(params.at(-1));
			const orderedDescending = sql.includes('order by "notes"."id" desc');
			const matchingNotes = this.notes.filter(
				(note) => cursor === undefined || note.id < cursor,
			);

			return (
				orderedDescending
					? matchingNotes.sort((left, right) => right.id - left.id)
					: matchingNotes
			)
				.slice(0, limit)
				.flatMap((note) => {
					const author = this.users.find(({ id }) => id === note.authorId);
					return author
						? [
								[
									note.id,
									note.title,
									note.imageKey,
									author.name,
									note.createdAt,
								],
							]
						: [];
				});
		}

		if (sql.includes("count(*)") && sql.includes('from "likes"')) {
			const noteId = Number(params[0]);
			return [[this.likes.filter((like) => like.noteId === noteId).length]];
		}

		if (sql.includes('from "likes"')) {
			const [noteId, userId] = params;
			return this.likes.some(
				(like) => like.noteId === Number(noteId) && like.userId === userId,
			)
				? [[Number(noteId)]]
				: [];
		}

		throw new Error(`Unsupported test query: ${sql}`);
	}
}

class FakeD1Statement {
	constructor(
		private readonly sql: string,
		private readonly params: unknown[],
		private readonly execute: (sql: string, params: unknown[]) => unknown[][],
	) {}

	bind(...params: unknown[]) {
		return new FakeD1Statement(this.sql, params, this.execute);
	}

	async raw() {
		return this.execute(this.sql, this.params);
	}
}

const users: FakeUser[] = [
	{ id: "author-1", name: "体验官小艾" },
	{ id: "viewer-1", name: "读者" },
];

const notes: FakeNote[] = [
	{
		id: 2,
		authorId: "author-1",
		title: "第二篇",
		body: "正文二",
		tags: '["城市"]',
		imageKey: "seed/note-02.png",
		createdAt: Date.UTC(2026, 7, 10),
	},
	{
		id: 11,
		authorId: "author-1",
		title: "第十一篇",
		body: "正文十一",
		tags: '["周末"]',
		imageKey: "seed/note 11.png",
		createdAt: Date.UTC(2026, 7, 12),
	},
	{
		id: 10,
		authorId: "author-1",
		title: "第十篇",
		body: "正文十",
		tags: '["旅行","咖啡"]',
		imageKey: "seed/note-10.png",
		createdAt: Date.UTC(2026, 7, 11),
	},
];

const fakeDb = createDb(
	new FakeD1(users, notes, [
		{ noteId: 10, userId: "viewer-1" },
		{ noteId: 10, userId: "reader-2" },
	]) as unknown as D1Database,
);

describe("notes service", () => {
	test("lists numeric ids descending and emits a cursor from the returned page", async () => {
		const service = createNotesService(fakeDb, "https://api.example.com/");

		const output = await service.list({ limit: 2 });

		expect(output).toEqual({
			items: [
				{
					id: "11",
					title: "第十一篇",
					coverUrl: "https://api.example.com/images/seed/note%2011.png",
					authorName: "体验官小艾",
					createdAt: "2026-08-12T00:00:00.000Z",
				},
				{
					id: "10",
					title: "第十篇",
					coverUrl: "https://api.example.com/images/seed/note-10.png",
					authorName: "体验官小艾",
					createdAt: "2026-08-11T00:00:00.000Z",
				},
			],
			nextCursor: "10",
		});
	});

	test("uses a numeric cursor to select the next page", async () => {
		const service = createNotesService(fakeDb, "https://api.example.com");

		const output = await service.list({ cursor: "10", limit: 2 });

		expect(output.items.map(({ id }) => id)).toEqual(["2"]);
		expect(output.nextCursor).toBeNull();
	});

	test("returns detail counts, strict tags, absolute image URLs, and viewer state", async () => {
		const service = createNotesService(fakeDb, "https://api.example.com");

		const output = await service.get("10", "viewer-1");

		expect(output).toEqual({
			id: "10",
			title: "第十篇",
			coverUrl: "https://api.example.com/images/seed/note-10.png",
			authorName: "体验官小艾",
			createdAt: "2026-08-11T00:00:00.000Z",
			body: "正文十",
			tags: ["旅行", "咖啡"],
			imageUrl: "https://api.example.com/images/seed/note-10.png",
			likeCount: 2,
			viewerHasLiked: true,
			authorId: "author-1",
		});
	});

	test("returns false viewer state for anonymous detail reads", async () => {
		const service = createNotesService(fakeDb, "https://api.example.com");

		const output = await service.get("10", null);

		expect(output?.likeCount).toBe(2);
		expect(output?.viewerHasLiked).toBeFalse();
	});

	test("returns null when the note does not exist", async () => {
		const service = createNotesService(fakeDb, "https://api.example.com");

		expect(await service.get("999", null)).toBeNull();
	});

	test("creates a note and returns its detail", async () => {
		const service = createNotesService(fakeDb, "https://api.example.com");

		const output = await service.create(
			{
				title: "新发布",
				body: "刚刚发布的正文",
				tags: ["新标签"],
				imageKey: "notes/new-1.jpg",
			},
			"author-1",
		);

		expect(output.id).toBe("12");
		expect(output.title).toBe("新发布");
		expect(output.body).toBe("刚刚发布的正文");
		expect(output.tags).toEqual(["新标签"]);
		expect(output.authorId).toBe("author-1");
		expect(output.likeCount).toBe(0);
		expect(output.viewerHasLiked).toBeFalse();

		const listed = await service.list({ limit: 1 });
		expect(listed.items[0]?.id).toBe("12");
	});

	test("rejects malformed stored tags", async () => {
		const firstNote = notes[0];
		if (!firstNote) throw new Error("Test fixture is missing a note");
		const malformedDb = createDb(
			new FakeD1(
				users,
				[{ ...firstNote, tags: '{"城市":true}' }],
				[],
			) as unknown as D1Database,
		);
		const service = createNotesService(malformedDb, "https://api.example.com");

		await expect(service.get("2", null)).rejects.toThrow();
	});
});
