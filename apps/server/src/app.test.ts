import { describe, expect, test } from "bun:test";
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import { app } from "./app";
import type { ServerEnv } from "./types";

const authSecret = "test-secret-at-least-sixteen-characters";

function envWithBindings({
	db,
	bucket,
}: {
	db?: D1Database;
	bucket?: R2Bucket;
} = {}) {
	return {
		BETTER_AUTH_SECRET: authSecret,
		BETTER_AUTH_URL: "http://localhost",
		CORS_ORIGIN: "http://localhost:8081",
		CORS_ORIGINS: "",
		SEED_SECRET: "seed-secret",
		DB:
			db ??
			({
				prepare: () => {
					throw new Error("D1 should not be queried");
				},
			} as unknown as D1Database),
		IMAGES:
			bucket ??
			({
				get: async () => null,
			} as unknown as R2Bucket),
	} satisfies ServerEnv;
}

async function signSessionToken(token: string) {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(authSecret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(token),
	);
	const base64Signature = btoa(
		String.fromCharCode(...new Uint8Array(signature)),
	);

	return encodeURIComponent(`${token}.${base64Signature}`);
}

function healthRequest(cookie?: string) {
	return new Request("http://localhost/rpc/health", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			...(cookie ? { cookie } : {}),
		},
		body: "{}",
	});
}

describe("server app HTTP boundaries", () => {
	test("mounts the public image route on the single app", async () => {
		const bucket = {
			get: async (key: string) =>
				key === "seed/note-01.png"
					? {
							body: "image-through-app",
							httpEtag: '"app-etag"',
							writeHttpMetadata(headers: Headers) {
								headers.set("content-type", "image/png");
							},
						}
					: null,
		} as unknown as R2Bucket;

		const response = await app.request(
			"http://localhost/images/seed/note-01.png",
			undefined,
			envWithBindings({ bucket }),
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("image/png");
		expect(await response.text()).toBe("image-through-app");
	});

	test("treats an invalid session cookie as anonymous for public RPC", async () => {
		const response = await app.fetch(
			healthRequest("better-auth.session_token=invalid-signature"),
			envWithBindings(),
		);

		expect(response.status).toBe(200);
		const body: unknown = await response.json();
		expect(body).toEqual({ json: { ok: true } });
	});

	test("does not hide authentication infrastructure failures", async () => {
		const signedToken = await signSessionToken("session-token");
		const response = await app.fetch(
			healthRequest(`better-auth.session_token=${signedToken}`),
			envWithBindings(),
		);

		expect(response.status).toBe(500);
	});

	test("serves index.html for unmatched GET deep links when ASSETS is bound", async () => {
		const env = {
			...envWithBindings(),
			ASSETS: {
				fetch: async (request: Request) => {
					expect(new URL(request.url).pathname).toBe("/index.html");
					return new Response("<!doctype html><html></html>", {
						status: 200,
						headers: { "content-type": "text/html" },
					});
				},
			},
		} as unknown as ServerEnv;

		const response = await app.fetch(
			new Request("http://localhost/note/123", { method: "GET" }),
			env,
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/html");
		expect(await response.text()).toContain("<!doctype html>");
	});

	test("returns 404 for unmatched GET deep links without an ASSETS binding", async () => {
		const response = await app.fetch(
			new Request("http://localhost/note/123", { method: "GET" }),
			envWithBindings(),
		);

		expect(response.status).toBe(404);
	});

	test("does not let the SPA fallback swallow API routes", async () => {
		const bucket = {
			get: async () => null,
		} as unknown as R2Bucket;
		const env = {
			...envWithBindings({ bucket }),
			ASSETS: {
				fetch: async () => new Response("html", { status: 200 }),
			},
		} as unknown as ServerEnv;

		const response = await app.fetch(
			new Request("http://localhost/images/missing.png", { method: "GET" }),
			env,
		);

		expect(response.status).toBe(404);
		const body: unknown = await response.json();
		expect(body).toEqual({ ok: false, error: "图片不存在" });
	});
});
