import { afterEach, describe, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import type { NoteDetail, NotesListOutput } from "@xhs/api";
import {
	type NotesClient,
	noteQueryOptions,
	notesKeys,
	notesListQueryOptions,
} from "./query-options";

const servers: Bun.Server<undefined>[] = [];

afterEach(() => {
	for (const server of servers.splice(0)) server.stop(true);
});

function createStalledJsonEndpoint() {
	let markStarted: (() => void) | undefined;
	const started = new Promise<void>((resolve) => {
		markStarted = resolve;
	});
	const server = Bun.serve({
		port: 0,
		fetch() {
			markStarted?.();
			return new Response(
				new ReadableStream({
					start(controller) {
						controller.enqueue(new TextEncoder().encode('{"items":'));
					},
				}),
				{ headers: { "content-type": "application/json" } },
			);
		},
	});
	servers.push(server);

	return { started, url: `http://127.0.0.1:${server.port}` };
}

function createFetchClient(url: string) {
	let markBodyStarted:
		| ((body: { promise: Promise<unknown> }) => void)
		| undefined;
	const bodyStarted = new Promise<{ promise: Promise<unknown> }>((resolve) => {
		markBodyStarted = resolve;
	});

	const readBody = async (signal?: AbortSignal) => {
		const response = await fetch(url, { signal });
		const body = response.json();
		markBodyStarted?.({ promise: body });
		return body;
	};

	const client: NotesClient = {
		notes: {
			async list(_input, options) {
				return (await readBody(options?.signal)) as NotesListOutput;
			},
			async get(_input, options) {
				return (await readBody(options?.signal)) as NoteDetail;
			},
		},
	};

	return {
		client,
		bodyStarted,
	};
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

describe("notes query cancellation", () => {
	test("cancels an in-flight list response body", async () => {
		const endpoint = createStalledJsonEndpoint();
		const fetchClient = createFetchClient(endpoint.url);
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		const promise = queryClient.fetchInfiniteQuery(
			notesListQueryOptions(fetchClient.client),
		);

		await endpoint.started;
		const body = await fetchClient.bodyStarted;
		const queryState = settlesRejected(promise);
		const bodyState = settlesRejected(body.promise);
		await queryClient.cancelQueries({ queryKey: notesKeys.list() });

		expect(await queryState).toBe("rejected");
		expect(await bodyState).toBe("rejected");
	});

	test("cancels an in-flight detail response body", async () => {
		const endpoint = createStalledJsonEndpoint();
		const fetchClient = createFetchClient(endpoint.url);
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		const promise = queryClient.fetchQuery(
			noteQueryOptions(fetchClient.client, "1"),
		);

		await endpoint.started;
		const body = await fetchClient.bodyStarted;
		const queryState = settlesRejected(promise);
		const bodyState = settlesRejected(body.promise);
		await queryClient.cancelQueries({ queryKey: notesKeys.detail("1") });

		expect(await queryState).toBe("rejected");
		expect(await bodyState).toBe("rejected");
	});
});
