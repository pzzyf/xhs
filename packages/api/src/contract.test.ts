// @ts-expect-error Bun test types are not a package dependency.
import { describe, expect, test } from "bun:test";
import {
	noteIdInputSchema,
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
