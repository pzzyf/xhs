import { describe, expect, test } from "bun:test";
import type { NotesListOutput } from "@xhs/api";
import { flattenNotePages } from "./queries";

const item = (id: string) => ({
	id,
	title: `笔记 ${id}`,
	coverUrl: `http://localhost:3000/images/${id}.png`,
	authorName: "体验官小艾",
	createdAt: "2026-08-12T00:00:00.000Z",
});

describe("flattenNotePages", () => {
	test("preserves order and removes duplicate ids", () => {
		const pages: NotesListOutput[] = [
			{ items: [item("3"), item("2")], nextCursor: "2" },
			{ items: [item("2"), item("1")], nextCursor: null },
		];

		expect(flattenNotePages(pages).map((note) => note.id)).toEqual([
			"3",
			"2",
			"1",
		]);
	});

	test("returns an empty list when no pages have loaded", () => {
		expect(flattenNotePages(undefined)).toEqual([]);
	});
});
