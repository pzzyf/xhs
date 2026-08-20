import { describe, expect, test } from "bun:test";

import {
	DEFAULT_NOTE_COVER_RATIO,
	getCoverAspectRatio,
	getMasonryCoverAspectRatio,
} from "./note-card-ratio";

describe("getCoverAspectRatio", () => {
	test("returns the image width-to-height ratio", () => {
		expect(getCoverAspectRatio(1200, 800)).toBe(1.5);
	});

	test("uses the 3:4 fallback for invalid dimensions", () => {
		expect(getCoverAspectRatio(0, 800)).toBe(DEFAULT_NOTE_COVER_RATIO);
		expect(getCoverAspectRatio(800, Number.NaN)).toBe(DEFAULT_NOTE_COVER_RATIO);
	});

	test("keeps varied stable ratios for normalized seed images", () => {
		const first = getMasonryCoverAspectRatio("1", 480, 640);
		const second = getMasonryCoverAspectRatio("2", 480, 640);

		expect(first).not.toBe(second);
		expect(getMasonryCoverAspectRatio("new", 1200, 800)).toBe(1.5);
	});
});
