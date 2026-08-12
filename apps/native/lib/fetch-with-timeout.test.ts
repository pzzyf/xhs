import { afterEach, describe, expect, test } from "bun:test";
import { fetchWithTimeout } from "./fetch-with-timeout";

const servers: Bun.Server<undefined>[] = [];

afterEach(() => {
	for (const server of servers.splice(0)) server.stop(true);
});

function startServer(fetchHandler: () => Response) {
	const server = Bun.serve({ port: 0, fetch: fetchHandler });
	servers.push(server);
	return `http://127.0.0.1:${server.port}`;
}

async function settlesRejected(promise: Promise<unknown>) {
	return Promise.race([
		promise.then(
			() => "resolved",
			() => "rejected",
		),
		new Promise<"stalled">((resolve) =>
			setTimeout(() => resolve("stalled"), 250),
		),
	]);
}

describe("fetchWithTimeout", () => {
	test("rejects when the caller signal was already aborted", async () => {
		const url = startServer(() => new Response("unused"));
		const caller = new AbortController();
		caller.abort();

		const result = fetchWithTimeout(
			new Request(url, { signal: caller.signal }),
			1_000,
		);

		expect(await settlesRejected(result)).toBe("rejected");
	});

	test("times out while consuming a response body", async () => {
		const url = startServer(
			() =>
				new Response(
					new ReadableStream({
						start(controller) {
							controller.enqueue(new TextEncoder().encode('{"ok":'));
						},
					}),
					{ headers: { "content-type": "application/json" } },
				),
		);
		const response = await fetchWithTimeout(new Request(url), 25);

		expect(await settlesRejected(response.json())).toBe("rejected");
	});
});
