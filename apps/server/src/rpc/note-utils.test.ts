import { describe, expect, test } from "bun:test";

import { buildImageUrl, parseTags, splitPage } from "./note-utils";

describe("note utils", () => {
	test("splits limit + 1 rows and emits the last returned id", () => {
		const result = splitPage([{ id: 16 }, { id: 15 }, { id: 14 }], 2);

		expect(result).toEqual({
			items: [{ id: 16 }, { id: 15 }],
			nextCursor: "15",
		});
	});

	test("returns a null cursor on the last page", () => {
		expect(splitPage([{ id: 2 }, { id: 1 }], 10).nextCursor).toBeNull();
	});

	test("parses string-array tags", () => {
		expect(parseTags('["旅行","咖啡"]')).toEqual(["旅行", "咖啡"]);
	});

	test("rejects malformed tag payloads", () => {
		expect(() => parseTags('{"tag":1}')).toThrow();
	});

	test("encodes image key segments without removing slashes", () => {
		expect(buildImageUrl("http://localhost:3000", "seed/空 格.png")).toBe(
			"http://localhost:3000/images/seed/%E7%A9%BA%20%E6%A0%BC.png",
		);
	});
});
