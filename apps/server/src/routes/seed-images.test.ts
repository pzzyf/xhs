import { describe, expect, test } from "bun:test";
import type { R2Bucket } from "@cloudflare/workers-types";
import type { ServerEnv } from "../types";
import { seedImageRoutes } from "./seed-images";

function envWithBucket(bucket: R2Bucket) {
	return {
		BETTER_AUTH_SECRET: "test-secret-at-least-sixteen-characters",
		BETTER_AUTH_URL: "http://localhost",
		CORS_ORIGIN: "http://localhost:8081",
		CORS_ORIGINS: "",
		SEED_SECRET: "seed-secret",
		IMAGES: bucket,
	} as ServerEnv;
}

function putRequest(url: string, secret?: string, body?: BodyInit) {
	const headers = new Headers();
	if (secret !== undefined) {
		headers.set("x-seed-secret", secret);
	}
	if (body) {
		headers.set("content-type", "image/jpeg");
	}
	return new Request(url, { method: "PUT", headers, body });
}

describe("seed image upload route", () => {
	test("requires the seed secret", async () => {
		const bucket = {
			put: async () => {
				throw new Error("R2 must not be written without a valid secret");
			},
		} as unknown as R2Bucket;

		const response = await seedImageRoutes.request(
			"http://localhost/api/dev/seed/images/seed%2Fnote-01.png",
			putRequest("http://localhost/api/dev/seed/images/seed%2Fnote-01.png"),
			envWithBucket(bucket),
		);

		expect(response.status).toBe(401);
		const body: unknown = await response.json();
		expect(body).toEqual({ ok: false, error: "种子密钥不正确" });
	});

	test("rejects keys outside the seed/ prefix", async () => {
		const bucket = {
			put: async () => {
				throw new Error("R2 must not be written for an invalid key");
			},
		} as unknown as R2Bucket;

		const response = await seedImageRoutes.request(
			"http://localhost/api/dev/seed/images/other%2Fnote.png",
			putRequest(
				"http://localhost/api/dev/seed/images/other%2Fnote.png",
				"seed-secret",
				"bytes",
			),
			envWithBucket(bucket),
		);

		expect(response.status).toBe(400);
		const body: unknown = await response.json();
		expect(body).toEqual({
			ok: false,
			error: "key 必须以 seed/ 开头且仅含字母数字与连字符",
		});
	});

	test("stores the decoded key with the declared content type", async () => {
		let receivedKey = "";
		let receivedContentType = "";
		const bucket = {
			put: async (
				key: string,
				_value: ArrayBuffer,
				options: { httpMetadata?: { contentType?: string } },
			) => {
				receivedKey = key;
				receivedContentType = options.httpMetadata?.contentType ?? "";
			},
		} as unknown as R2Bucket;

		const response = await seedImageRoutes.request(
			"http://localhost/api/dev/seed/images/seed%2Fnote-01.png",
			putRequest(
				"http://localhost/api/dev/seed/images/seed%2Fnote-01.png",
				"seed-secret",
				"jpeg-bytes",
			),
			envWithBucket(bucket),
		);

		expect(response.status).toBe(200);
		const body: unknown = await response.json();
		expect(body).toEqual({ ok: true, key: "seed/note-01.png", bytes: 10 });
		expect(receivedKey).toBe("seed/note-01.png");
		expect(receivedContentType).toBe("image/jpeg");
	});

	test("rejects bodies beyond the 8 MiB limit", async () => {
		const bucket = {
			put: async () => {
				throw new Error("R2 must not be written for an oversized body");
			},
		} as unknown as R2Bucket;

		const request = putRequest(
			"http://localhost/api/dev/seed/images/seed%2Fnote-01.png",
			"seed-secret",
			"x".repeat(9 * 1024 * 1024),
		);

		const response = await seedImageRoutes.request(
			"http://localhost/api/dev/seed/images/seed%2Fnote-01.png",
			request,
			envWithBucket(bucket),
		);

		expect(response.status).toBe(413);
		const body: unknown = await response.json();
		expect(body).toEqual({ ok: false, error: "图片过大" });
	});
});
