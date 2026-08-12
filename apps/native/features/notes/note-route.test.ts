import { describe, expect, test } from "bun:test";
import { normalizeNoteId } from "./note-route";

describe("normalizeNoteId", () => {
	test("accepts a positive scalar id", () => {
		expect(normalizeNoteId("16")).toBe("16");
	});

	test("uses the first array value", () => {
		expect(normalizeNoteId(["7", "6"])).toBe("7");
	});

	test.each([undefined, "", "0", "abc"])("rejects %p", (value) => {
		expect(normalizeNoteId(value)).toBeNull();
	});
});
