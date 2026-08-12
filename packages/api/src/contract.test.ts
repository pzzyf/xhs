// @ts-expect-error Bun test types are not a package dependency.
import { describe, expect, test } from "bun:test";
import { noteIdInputSchema, notesListInputSchema } from "./contract";

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
