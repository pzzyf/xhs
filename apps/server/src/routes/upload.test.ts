import { describe, expect, test } from "bun:test";
import type { R2Bucket } from "@cloudflare/workers-types";
import type { ServerEnv } from "../types";
import { createUploadRoutes } from "./upload";

function envWithBucket(bucket: R2Bucket) {
	return { IMAGES: bucket } as ServerEnv;
}

describe("image upload routes", () => {
	test("stores an authenticated image and returns its key and url", async () => {
		const bucket = {
			put: async (key: string, body: ArrayBuffer) => {
				expect(key).toMatch(/^notes\/[\w-]+\.png$/);
				expect(body.byteLength).toBe(4);
			},
		} as unknown as R2Bucket;
		const routes = createUploadRoutes(async () => "user-1");

		const response = await routes.request(
			"http://localhost/api/images",
			{
				method: "PUT",
				headers: { "content-type": "image/png" },
				body: new Uint8Array([1, 2, 3, 4]),
			},
			envWithBucket(bucket),
		);

		expect(response.status).toBe(200);
		const payload = (await response.json()) as {
			ok: boolean;
			imageKey: string;
			imageUrl: string;
		};
		expect(payload.ok).toBe(true);
		expect(payload.imageKey).toMatch(/^notes\/[\w-]+\.png$/);
		expect(payload.imageUrl).toBe(`/images/${payload.imageKey}`);
	});

	test("rejects unauthenticated uploads", async () => {
		const routes = createUploadRoutes(async () => null);
		const response = await routes.request(
			"http://localhost/api/images",
			{
				method: "PUT",
				headers: { "content-type": "image/png" },
				body: new Uint8Array([1, 2, 3, 4]),
			},
			envWithBucket({} as R2Bucket),
		);

		expect(response.status).toBe(401);
	});

	test("rejects non-image content types", async () => {
		const routes = createUploadRoutes(async () => "user-1");
		const response = await routes.request(
			"http://localhost/api/images",
			{
				method: "PUT",
				headers: { "content-type": "text/plain" },
				body: new Uint8Array([1, 2, 3, 4]),
			},
			envWithBucket({} as R2Bucket),
		);

		expect(response.status).toBe(400);
	});

	test("rejects empty bodies", async () => {
		const routes = createUploadRoutes(async () => "user-1");
		const response = await routes.request(
			"http://localhost/api/images",
			{
				method: "PUT",
				headers: { "content-type": "image/png" },
				body: new Uint8Array([]),
			},
			envWithBucket({} as R2Bucket),
		);

		expect(response.status).toBe(400);
	});
});
