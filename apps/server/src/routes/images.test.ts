import { describe, expect, test } from "bun:test";
import type { R2Bucket } from "@cloudflare/workers-types";
import type { ServerEnv } from "../types";
import { imageRoutes } from "./images";

function envWithBucket(bucket: R2Bucket) {
	return { IMAGES: bucket } as ServerEnv;
}

function imageObject(body: string) {
	return {
		body,
		httpEtag: '"seed-etag"',
		writeHttpMetadata(headers: Headers) {
			headers.set("content-type", "image/png");
		},
	};
}

describe("image routes", () => {
	test("streams an existing image with its stored metadata and immutable caching", async () => {
		const bucket = {
			get: async (key: string) =>
				key === "seed/note-01.png" ? imageObject("png-bytes") : null,
		} as unknown as R2Bucket;

		const response = await imageRoutes.request(
			"http://localhost/images/seed/note-01.png",
			undefined,
			envWithBucket(bucket),
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("image/png");
		expect(response.headers.get("etag")).toBe('"seed-etag"');
		expect(response.headers.get("cache-control")).toBe(
			"public, max-age=31536000, immutable",
		);
		expect(await response.text()).toBe("png-bytes");
	});

	test("decodes each encoded image-key segment before reading R2", async () => {
		const bucket = {
			get: async (key: string) =>
				key === "seed/空 格.png" ? imageObject("decoded-key-image") : null,
		} as unknown as R2Bucket;

		const response = await imageRoutes.request(
			"http://localhost/images/seed/%E7%A9%BA%20%E6%A0%BC.png",
			undefined,
			envWithBucket(bucket),
		);

		expect(response.status).toBe(200);
		expect(await response.text()).toBe("decoded-key-image");
	});

	test("returns a Chinese 404 response for an absent object", async () => {
		const bucket = { get: async () => null } as unknown as R2Bucket;

		const response = await imageRoutes.request(
			"http://localhost/images/missing.png",
			undefined,
			envWithBucket(bucket),
		);

		expect(response.status).toBe(404);
		expect(response.headers.get("content-type")).toContain("application/json");
		const body: unknown = await response.json();
		expect(body).toEqual({
			ok: false,
			error: "图片不存在",
		});
	});

	test("returns a Chinese 400 response for a malformed encoded key", async () => {
		const bucket = {
			get: async () => {
				throw new Error("R2 must not be queried for an invalid key");
			},
		} as unknown as R2Bucket;

		const response = await imageRoutes.request(
			"http://localhost/images/seed/%E0%A4%A.png",
			undefined,
			envWithBucket(bucket),
		);

		expect(response.status).toBe(400);
		const body: unknown = await response.json();
		expect(body).toEqual({
			ok: false,
			error: "图片地址无效",
		});
	});
});
