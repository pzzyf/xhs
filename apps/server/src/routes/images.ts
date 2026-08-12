import { Hono } from "hono";
import type { ServerEnv } from "../types";

export const imageRoutes = new Hono<{ Bindings: ServerEnv }>();

imageRoutes.get("/images/*", async (c) => {
	const pathname = new URL(c.req.url).pathname;
	const encodedKey = pathname.slice("/images/".length);
	let key: string;

	try {
		key = encodedKey.split("/").map(decodeURIComponent).join("/");
	} catch (error) {
		if (error instanceof URIError) {
			return c.json({ ok: false, error: "图片地址无效" }, 400);
		}

		throw error;
	}

	const object = await c.env.IMAGES.get(key);

	if (!object) {
		return c.json({ ok: false, error: "图片不存在" }, 404);
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set("etag", object.httpEtag);
	headers.set("cache-control", "public, max-age=31536000, immutable");

	return new Response(object.body, { headers });
});
