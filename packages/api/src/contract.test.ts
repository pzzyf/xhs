// @ts-expect-error Bun test types are not a package dependency.
import { describe, expect, test } from "bun:test";
import {
	likesToggleInputSchema,
	meProfileOutputSchema,
	noteIdInputSchema,
	noteListItemSchema,
	notesCreateInputSchema,
	notesListInputSchema,
} from "./contract";

describe("notes contract inputs", () => {
	test("defaults list limit to 10", () => {
		expect(notesListInputSchema.parse({})).toEqual({ limit: 10 });
	});

	test("accepts positive decimal cursors and a limit up to 20", () => {
		expect(notesListInputSchema.parse({ cursor: "16", limit: 20 })).toEqual({
			cursor: "16",
			limit: 20,
		});
	});

	test.each(["", "0", "-1", "1.5", "abc"])(
		"rejects invalid cursor %s",
		(cursor: string) => {
			expect(notesListInputSchema.safeParse({ cursor }).success).toBe(false);
		},
	);

	test.each([0, 21, 1.5])("rejects invalid limit %s", (limit: number) => {
		expect(notesListInputSchema.safeParse({ limit }).success).toBe(false);
	});

	test.each(["1", "99"])("accepts positive note id %s", (id: string) => {
		expect(noteIdInputSchema.parse({ id })).toEqual({ id });
	});
});

describe("notes create input", () => {
	const valid = {
		title: "周末咖啡馆",
		body: "今天去了新开的咖啡馆",
		tags: ["咖啡", "周末"],
		imageKey: "notes/abc-123.jpg",
	};

	test("accepts a valid create payload", () => {
		expect(notesCreateInputSchema.parse(valid)).toEqual(valid);
	});

	test("trims title, body, and tags", () => {
		const output = notesCreateInputSchema.parse({
			...valid,
			title: "  标题  ",
			body: " 正文 ",
			tags: [" 咖啡 ", "旅行"],
		});
		expect(output.title).toBe("标题");
		expect(output.body).toBe("正文");
		expect(output.tags).toEqual(["咖啡", "旅行"]);
	});

	test.each(["", "   "])("rejects empty title %j", (title: string) => {
		expect(notesCreateInputSchema.safeParse({ ...valid, title }).success).toBe(
			false,
		);
	});

	test("rejects more than 5 tags", () => {
		expect(
			notesCreateInputSchema.safeParse({
				...valid,
				tags: ["1", "2", "3", "4", "5", "6"],
			}).success,
		).toBe(false);
	});

	test("rejects a tag longer than 20 characters", () => {
		expect(
			notesCreateInputSchema.safeParse({
				...valid,
				tags: ["这是一个超过二十个字符的很长很长的标签内容"],
			}).success,
		).toBe(false);
	});

	test("rejects an empty imageKey", () => {
		expect(
			notesCreateInputSchema.safeParse({ ...valid, imageKey: "" }).success,
		).toBe(false);
	});
});

describe("likes toggle input", () => {
	test("accepts a positive note id", () => {
		expect(likesToggleInputSchema.parse({ noteId: "16" })).toEqual({
			noteId: "16",
		});
	});

	test.each(["", "0", "-1", "abc"])(
		"rejects invalid note id %s",
		(noteId: string) => {
			expect(likesToggleInputSchema.safeParse({ noteId }).success).toBe(false);
		},
	);
});

describe("me contract outputs", () => {
	test("accepts a profile payload", () => {
		expect(
			meProfileOutputSchema.parse({
				id: "user-1",
				name: "体验官小艾",
				email: "demo@xhs.dev",
				image: null,
			}),
		).toEqual({
			id: "user-1",
			name: "体验官小艾",
			email: "demo@xhs.dev",
			image: null,
		});
	});

	test("accepts note list items", () => {
		const item = {
			id: "16",
			title: "周末咖啡馆打卡",
			coverUrl: "https://example.com/images/seed/note-01.png",
			authorName: "体验官小艾",
			createdAt: "2026-08-12T00:00:00.000Z",
		};
		expect(noteListItemSchema.parse(item)).toEqual(item);
	});
});
