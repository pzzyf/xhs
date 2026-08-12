# P3 Readonly Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a contract-first, read-only notes feed and detail flow backed by real D1/R2 seed data, with cursor pagination shared end to end through oRPC.

**Architecture:** Define the Zod/oRPC boundary in `packages/api`, implement a small notes service and contract router in the Worker, then consume it from Expo through a typed oRPC client and TanStack Query. Keep transport, database mapping, query state, and presentation in focused files so pagination and error behavior can be tested without rendering the full app.

**Tech Stack:** Bun 1.3.14, TypeScript 6, Zod 4, oRPC 1.14.15, Hono 4, Drizzle ORM/D1, Cloudflare R2, Expo 57, React Native 0.86, Expo Router 57, TanStack Query 5.

## Global Constraints

- P3 is strictly read-only: no like/unlike mutation, clickable like control, or unauthenticated-like redirect.
- `notes.list` defaults to 10 items, accepts 1–20, orders by numeric `notes.id DESC`, and uses the last returned ID as a string cursor.
- D1 note IDs stay integers internally; every API ID and cursor is a positive decimal string.
- Feed and detail remain public and show the same content regardless of authentication state.
- The list never returns or renders like counts; detail returns `likeCount` and `viewerHasLiked` for read-only display.
- Native UI copy is Chinese only; keep the teal accent `#16a085` and do not copy Xiaohongshu trademarks or brand red.
- Use the existing Query → Gesture → SafeArea → Keyboard → HeroUI → Toast → Auth → Theme → Router provider order.
- Bun is the only package manager; do not hand-edit `bun.lock`.
- Alchemy remains the only Cloudflare IaC path; do not add Wrangler configuration.
- Commit commands below are checkpoints, not blanket authorization. Run them only after the user explicitly requests a commit, per repository policy.
- Do not push, tag, deploy, or open a PR unless the user explicitly requests it.

---

## File Map

### Shared API

- Modify `packages/api/src/contract.ts`: Zod schemas and `health`, `notes.list`, `notes.get` contract tree.
- Modify `packages/api/src/index.ts`: continue exporting the public contract surface.
- Create `packages/api/src/contract.test.ts`: schema defaults and invalid-input coverage.

### Worker

- Create `apps/server/src/rpc/note-utils.ts`: tag parsing, image URL construction, and `limit + 1` page splitting.
- Create `apps/server/src/rpc/note-utils.test.ts`: pure mapping and pagination tests.
- Create `apps/server/src/rpc/notes-service.ts`: Drizzle queries and API-row mapping.
- Create `apps/server/src/rpc/router.ts`: contract implementation and `NOT_FOUND` behavior.
- Create `apps/server/src/rpc/router.test.ts`: router behavior against a fake notes service.
- Create `apps/server/src/routes/images.ts`: public R2 image read endpoint.
- Create `apps/server/src/routes/images.test.ts`: 200/404 behavior against a fake bucket.
- Modify `apps/server/src/app.ts`: mount `/rpc/*` and `/images/*`, construct optional-session context.

### Native

- Create `apps/native/lib/server-url.ts`: one normalized platform-aware server URL.
- Modify `apps/native/lib/auth-client.ts`: reuse `server-url.ts`.
- Create `apps/native/lib/orpc.ts`: typed RPC client, cookie forwarding on native, credentials on web, 10-second timeout.
- Create `apps/native/features/notes/queries.ts`: query keys, infinite list query, detail query, page flattening.
- Create `apps/native/features/notes/queries.test.ts`: deduplication and next-page behavior.
- Create `apps/native/features/notes/note-card.tsx`: focused two-column card component.
- Create `apps/native/features/notes/note-route.ts`: route ID normalization.
- Create `apps/native/features/notes/note-route.test.ts`: scalar/array/invalid route parameter coverage.
- Modify `apps/native/app/(tabs)/index.tsx`: real two-column infinite feed and Chinese states.
- Create `apps/native/app/note/[id].tsx`: read-only detail page.
- Modify `apps/native/app/_layout.tsx`: register the detail Stack route.

### Documentation

- Modify `docs/specs/v1-portfolio-app/plan/P3.md`: mark only verified checklist items complete.
- Modify `docs/specs/v1-portfolio-app/workflow-state.md`: record P3 evidence and set `awaiting-human-review` only after live acceptance.

---

### Task 1: Define the Shared Notes Contract

**Files:**
- Modify: `packages/api/src/contract.ts:1-8`
- Modify: `packages/api/src/index.ts:1`
- Create: `packages/api/src/contract.test.ts`

**Interfaces:**
- Consumes: `oc` from `@orpc/contract`, Zod 4.
- Produces: `apiContract`, `noteListItemSchema`, `noteDetailSchema`, `notesListInputSchema`, `noteIdInputSchema`, `NoteListItem`, `NoteDetail`, `NotesListOutput`.

- [x] **Step 1: Write failing schema tests**

```ts
import { describe, expect, test } from "bun:test";
import { noteIdInputSchema, notesListInputSchema } from "./contract";

describe("notes contract inputs", () => {
	test("defaults list limit to 10", () => {
		expect(notesListInputSchema.parse({})).toEqual({ limit: 10 });
	});

	test("accepts positive decimal cursors and a limit up to 20", () => {
		expect(notesListInputSchema.parse({ cursor: "16", limit: 20 })).toEqual({
			cursor: "16",
			limit: 20,
		});
	});

	test.each(["", "0", "-1", "1.5", "abc"])(
		"rejects invalid cursor %s",
		(cursor) => {
			expect(notesListInputSchema.safeParse({ cursor }).success).toBe(false);
		},
	);

	test.each([0, 21, 1.5])("rejects invalid limit %s", (limit) => {
		expect(notesListInputSchema.safeParse({ limit }).success).toBe(false);
	});

	test.each(["1", "99"])("accepts positive note id %s", (id) => {
		expect(noteIdInputSchema.parse({ id })).toEqual({ id });
	});
});
```

- [x] **Step 2: Run the test and verify the red state**

Run: `bun test packages/api/src/contract.test.ts`

Expected: FAIL because the four schema exports do not exist.

- [x] **Step 3: Implement the complete contract**

Replace `packages/api/src/contract.ts` with:

```ts
import { oc } from "@orpc/contract";
import { z } from "zod";

const positiveIdStringSchema = z.string().regex(/^[1-9]\d*$/);

export const noteListItemSchema = z.object({
	id: positiveIdStringSchema,
	title: z.string(),
	coverUrl: z.url(),
	authorName: z.string(),
	createdAt: z.iso.datetime(),
});

export const noteDetailSchema = noteListItemSchema.extend({
	body: z.string(),
	tags: z.array(z.string()),
	imageUrl: z.url(),
	likeCount: z.number().int().nonnegative(),
	viewerHasLiked: z.boolean(),
	authorId: z.string(),
});

export const notesListInputSchema = z.object({
	cursor: positiveIdStringSchema.optional(),
	limit: z.number().int().min(1).max(20).default(10),
});

export const noteIdInputSchema = z.object({ id: positiveIdStringSchema });

export const healthContract = oc.output(z.object({ ok: z.literal(true) }));

export const notesListContract = oc
	.input(notesListInputSchema)
	.output(
		z.object({
			items: z.array(noteListItemSchema),
			nextCursor: positiveIdStringSchema.nullable(),
		}),
	);

export const notesGetContract = oc
	.input(noteIdInputSchema)
	.output(noteDetailSchema);

export const apiContract = {
	health: healthContract,
	notes: {
		list: notesListContract,
		get: notesGetContract,
	},
};

export type NoteListItem = z.infer<typeof noteListItemSchema>;
export type NoteDetail = z.infer<typeof noteDetailSchema>;
export type NotesListOutput = {
	items: NoteListItem[];
	nextCursor: string | null;
};
```

Keep `packages/api/src/index.ts` as:

```ts
export * from "./contract";
```

- [x] **Step 4: Run tests and type checking**

Run: `bun test packages/api/src/contract.test.ts`

Expected: all contract tests PASS.

Run: `bun run --cwd packages/api check-types`

Expected: exit 0.

- [x] **Step 5: Check formatting**

Run: `bunx biome check packages/api/src/contract.ts packages/api/src/contract.test.ts packages/api/src/index.ts`

Expected: no diagnostics.

- [ ] **Step 6: Commit checkpoint, only with explicit approval**

```bash
git add packages/api/src/contract.ts packages/api/src/contract.test.ts packages/api/src/index.ts
git commit -m "feat(api): define read-only notes contract"
```

---

### Task 2: Build Tested Note Mapping and Pagination Utilities

**Files:**
- Create: `apps/server/src/rpc/note-utils.ts`
- Create: `apps/server/src/rpc/note-utils.test.ts`

**Interfaces:**
- Consumes: database rows with numeric `id`, JSON `tags`, and R2 `imageKey`.
- Produces: `parseTags(value)`, `buildImageUrl(origin, imageKey)`, `splitPage(rows, limit)`.

- [x] **Step 1: Write failing pure-unit tests**

```ts
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
```

- [x] **Step 2: Run the test and verify the red state**

Run: `bun test apps/server/src/rpc/note-utils.test.ts`

Expected: FAIL because `note-utils.ts` does not exist.

- [x] **Step 3: Implement the utilities**

```ts
import { z } from "zod";

const tagsSchema = z.array(z.string());

export function parseTags(value: string): string[] {
	return tagsSchema.parse(JSON.parse(value));
}

export function buildImageUrl(origin: string, imageKey: string): string {
	const encodedKey = imageKey.split("/").map(encodeURIComponent).join("/");
	return `${origin.replace(/\/$/, "")}/images/${encodedKey}`;
}

export function splitPage<T extends { id: number }>(rows: T[], limit: number) {
	const hasNextPage = rows.length > limit;
	const items = rows.slice(0, limit);
	const lastItem = items[items.length - 1];
	return {
		items,
		nextCursor: hasNextPage && lastItem ? String(lastItem.id) : null,
	};
}
```

- [x] **Step 4: Run tests and scoped checks**

Run: `bun test apps/server/src/rpc/note-utils.test.ts`

Expected: 5 PASS, 0 FAIL.

Run: `bunx biome check apps/server/src/rpc/note-utils.ts apps/server/src/rpc/note-utils.test.ts`

Expected: no diagnostics.

- [ ] **Step 5: Commit checkpoint, only with explicit approval**

```bash
git add apps/server/src/rpc/note-utils.ts apps/server/src/rpc/note-utils.test.ts
git commit -m "test(server): cover note pagination helpers"
```

---

### Task 3: Implement the Notes Service and Contract Router

**Files:**
- Create: `apps/server/src/rpc/notes-service.ts`
- Create: `apps/server/src/rpc/router.ts`
- Create: `apps/server/src/rpc/router.test.ts`

**Interfaces:**
- Consumes: `Database`, request origin, optional `viewerUserId`, shared `apiContract`.
- Produces: `NotesService.list(input)`, `NotesService.get(id, viewerUserId)`, `rpcRouter`, `RpcContext`.

- [x] **Step 1: Write failing router tests against a fake service**

```ts
import { describe, expect, test } from "bun:test";
import { call } from "@orpc/server";
import type { NotesService } from "./notes-service";
import { rpcRouter } from "./router";

const listResult = {
	items: [
		{
			id: "16",
			title: "周末咖啡馆打卡",
			coverUrl: "http://localhost:3000/images/seed/note-01.png",
			authorName: "体验官小艾",
			createdAt: "2026-08-12T00:00:00.000Z",
		},
	],
	nextCursor: null,
};

describe("rpc router", () => {
	test("forwards list input to the notes service", async () => {
		let receivedLimit = 0;
		const notes = {
			list: async (input) => {
				receivedLimit = input.limit;
				return listResult;
			},
			get: async () => null,
		} satisfies NotesService;

		const output = await call(
			rpcRouter.notes.list,
			{ limit: 10 },
			{ context: { notes, viewerUserId: null } },
		);
		expect(receivedLimit).toBe(10);
		expect(output).toEqual(listResult);
	});

	test("maps a missing note to NOT_FOUND", async () => {
		const notes = {
			list: async () => listResult,
			get: async () => null,
		} satisfies NotesService;

		await expect(
			call(
				rpcRouter.notes.get,
				{ id: "999" },
				{ context: { notes, viewerUserId: null } },
			),
		).rejects.toMatchObject({ code: "NOT_FOUND" });
	});
});
```

- [x] **Step 2: Run the router test and verify the red state**

Run: `bun test apps/server/src/rpc/router.test.ts`

Expected: FAIL because the service and router modules do not exist.

- [x] **Step 3: Define `NotesService` and implement Drizzle reads**

Use this public shape in `notes-service.ts`:

```ts
import type { NoteDetail, NotesListOutput } from "@xhs/api";
import { likes, notes, user, type Database } from "@xhs/db";
import { and, count, desc, eq, lt } from "drizzle-orm";
import { buildImageUrl, parseTags, splitPage } from "./note-utils";

export type NotesListInput = {
	cursor?: string;
	limit: number;
};

export interface NotesService {
	list(input: NotesListInput): Promise<NotesListOutput>;
	get(id: string, viewerUserId: string | null): Promise<NoteDetail | null>;
}

export function createNotesService(
	db: Database,
	origin: string,
): NotesService {
	return {
		async list(input) {
			const cursor = input.cursor ? Number(input.cursor) : undefined;
			const rows = await db
				.select({
					id: notes.id,
					title: notes.title,
					imageKey: notes.imageKey,
					authorName: user.name,
					createdAt: notes.createdAt,
				})
				.from(notes)
				.innerJoin(user, eq(notes.authorId, user.id))
				.where(cursor === undefined ? undefined : lt(notes.id, cursor))
				.orderBy(desc(notes.id))
				.limit(input.limit + 1);

			const page = splitPage(rows, input.limit);
			return {
				items: page.items.map((row) => ({
					id: String(row.id),
					title: row.title,
					coverUrl: buildImageUrl(origin, row.imageKey),
					authorName: row.authorName,
					createdAt: new Date(row.createdAt).toISOString(),
				})),
				nextCursor: page.nextCursor,
			};
		},

		async get(id, viewerUserId) {
			const noteId = Number(id);
			const [row] = await db
				.select({
					id: notes.id,
					title: notes.title,
					body: notes.body,
					tags: notes.tags,
					imageKey: notes.imageKey,
					createdAt: notes.createdAt,
					authorId: user.id,
					authorName: user.name,
				})
				.from(notes)
				.innerJoin(user, eq(notes.authorId, user.id))
				.where(eq(notes.id, noteId))
				.limit(1);

			if (!row) return null;

			const [countRow] = await db
				.select({ value: count() })
				.from(likes)
				.where(eq(likes.noteId, noteId));

			const viewerLike = viewerUserId
				? await db
						.select({ noteId: likes.noteId })
						.from(likes)
						.where(
							and(eq(likes.noteId, noteId), eq(likes.userId, viewerUserId)),
						)
						.limit(1)
				: [];

			const imageUrl = buildImageUrl(origin, row.imageKey);
			return {
				id: String(row.id),
				title: row.title,
				coverUrl: imageUrl,
				authorName: row.authorName,
				createdAt: new Date(row.createdAt).toISOString(),
				body: row.body,
				tags: parseTags(row.tags),
				imageUrl,
				likeCount: countRow?.value ?? 0,
				viewerHasLiked: viewerLike.length > 0,
				authorId: row.authorId,
			};
		},
	};
}
```

- [x] **Step 4: Implement the contract router**

```ts
import { apiContract } from "@xhs/api";
import { implement, ORPCError } from "@orpc/server";
import type { NotesService } from "./notes-service";

export type RpcContext = {
	notes: NotesService;
	viewerUserId: string | null;
};

const builder = implement(apiContract).$context<RpcContext>();

export const rpcRouter = builder.router({
	health: builder.health.handler(() => ({ ok: true as const })),
	notes: {
		list: builder.notes.list.handler(({ input, context }) =>
			context.notes.list(input),
		),
		get: builder.notes.get.handler(async ({ input, context }) => {
			const note = await context.notes.get(input.id, context.viewerUserId);
			if (!note) {
				throw new ORPCError("NOT_FOUND", { message: "笔记不存在" });
			}
			return note;
		}),
	},
});
```

- [x] **Step 5: Run router, utility, and type tests**

Run: `bun test apps/server/src/rpc/note-utils.test.ts apps/server/src/rpc/router.test.ts`

Expected: all tests PASS.

Run: `bun run --cwd apps/server check-types`

Expected: exit 0 with the `NotesService` and `RpcContext` interfaces above unchanged.

- [ ] **Step 6: Commit checkpoint, only with explicit approval**

```bash
git add apps/server/src/rpc/notes-service.ts apps/server/src/rpc/router.ts apps/server/src/rpc/router.test.ts
git commit -m "feat(server): implement read-only notes RPC"
```

---

### Task 4: Mount oRPC and Expose Seed Images from R2

**Files:**
- Create: `apps/server/src/routes/images.ts`
- Create: `apps/server/src/routes/images.test.ts`
- Modify: `apps/server/src/app.ts:1-62`

**Interfaces:**
- Consumes: `rpcRouter`, `createNotesService`, better-auth session, `DB`, `IMAGES`.
- Produces: `GET|POST /rpc/*` and public `GET /images/*`.

- [x] **Step 1: Write failing R2 route tests**

```ts
import { describe, expect, test } from "bun:test";
import type { R2Bucket } from "@cloudflare/workers-types";
import type { ServerEnv } from "../types";
import { imageRoutes } from "./images";

function envWithBucket(bucket: R2Bucket) {
	return { IMAGES: bucket } as ServerEnv;
}

describe("image routes", () => {
	test("streams an existing image with metadata", async () => {
		const bucket = {
			get: async (key: string) =>
				key === "seed/note-01.png"
					? {
							body: "png-bytes",
							httpEtag: '"seed-etag"',
							writeHttpMetadata(headers: Headers) {
								headers.set("content-type", "image/png");
							},
						}
					: null,
		} as unknown as R2Bucket;

		const response = await imageRoutes.request(
			"http://localhost/images/seed/note-01.png",
			undefined,
			envWithBucket(bucket),
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("image/png");
		expect(await response.text()).toBe("png-bytes");
	});

	test("returns 404 for an absent object", async () => {
		const bucket = { get: async () => null } as unknown as R2Bucket;
		const response = await imageRoutes.request(
			"http://localhost/images/missing.png",
			undefined,
			envWithBucket(bucket),
		);
		expect(response.status).toBe(404);
	});
});
```

- [x] **Step 2: Run the image test and verify the red state**

Run: `bun test apps/server/src/routes/images.test.ts`

Expected: FAIL because `images.ts` does not exist.

- [x] **Step 3: Implement the public image route**

```ts
import { Hono } from "hono";
import type { ServerEnv } from "../types";

export const imageRoutes = new Hono<{ Bindings: ServerEnv }>();

imageRoutes.get("/images/*", async (c) => {
	const pathname = new URL(c.req.url).pathname;
	const encodedKey = pathname.slice("/images/".length);
	const key = encodedKey.split("/").map(decodeURIComponent).join("/");
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
```

- [x] **Step 4: Mount image and RPC handlers in `app.ts`**

Add imports:

```ts
import { RPCHandler } from "@orpc/server/fetch";
import { createDb } from "@xhs/db";
import { createNotesService } from "./rpc/notes-service";
import { rpcRouter } from "./rpc/router";
import { imageRoutes } from "./routes/images";
```

Create one module-level handler:

```ts
const rpcHandler = new RPCHandler(rpcRouter);
```

After the auth route, mount RPC with a per-request service and optional viewer:

```ts
app.use("/rpc/*", async (c) => {
	const env = parseServerEnv(c.env);
	const auth = createAuth({
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		d1: c.env.DB,
		trustedOrigins: ["xhs://", env.CORS_ORIGIN, ...env.CORS_ORIGINS.split(",")]
			.map((origin) => origin.trim())
			.filter(Boolean),
	});
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	const origin = new URL(c.req.url).origin;
	const { matched, response } = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: {
			notes: createNotesService(createDb(c.env.DB), origin),
			viewerUserId: session?.user.id ?? null,
		},
	});

	return matched ? response : c.notFound();
});

app.route("/", imageRoutes);
```

Keep the seed route mounted once. Do not create a second Hono app or Worker entry point.

- [x] **Step 5: Run server tests and type checks**

Run: `bun test apps/server/src/routes/images.test.ts apps/server/src/rpc`

Expected: all server tests PASS.

Run: `bun run --cwd apps/server check-types`

Expected: exit 0.

Run: `bunx biome check apps/server/src/app.ts apps/server/src/rpc apps/server/src/routes/images.ts apps/server/src/routes/images.test.ts`

Expected: no diagnostics.

- [ ] **Step 6: Commit checkpoint, only with explicit approval**

```bash
git add apps/server/src/app.ts apps/server/src/routes/images.ts apps/server/src/routes/images.test.ts
git commit -m "feat(server): mount oRPC and public image reads"
```

---

### Task 5: Add the Typed Native Client and Query Layer

**Files:**
- Create: `apps/native/lib/server-url.ts`
- Modify: `apps/native/lib/auth-client.ts:1-24`
- Create: `apps/native/lib/orpc.ts`
- Create: `apps/native/features/notes/queries.ts`
- Create: `apps/native/features/notes/queries.test.ts`

**Interfaces:**
- Consumes: `apiContract`, `authClient.getCookie()`, `getServerUrl`, TanStack Query.
- Produces: `orpc`, `notesKeys`, `useNotesList()`, `useNote(id)`, `flattenNotePages(pages)`.

- [x] **Step 1: Write failing page-flattening tests**

```ts
import { describe, expect, test } from "bun:test";
import type { NotesListOutput } from "@xhs/api";
import { flattenNotePages } from "./queries";

const item = (id: string) => ({
	id,
	title: `笔记 ${id}`,
	coverUrl: `http://localhost:3000/images/${id}.png`,
	authorName: "体验官小艾",
	createdAt: "2026-08-12T00:00:00.000Z",
});

describe("flattenNotePages", () => {
	test("preserves order and removes duplicate ids", () => {
		const pages: NotesListOutput[] = [
			{ items: [item("3"), item("2")], nextCursor: "2" },
			{ items: [item("2"), item("1")], nextCursor: null },
		];
		expect(flattenNotePages(pages).map((note) => note.id)).toEqual([
			"3",
			"2",
			"1",
		]);
	});

	test("returns an empty list when no pages have loaded", () => {
		expect(flattenNotePages(undefined)).toEqual([]);
	});
});
```

- [x] **Step 2: Run the query test and verify the red state**

Run: `bun test apps/native/features/notes/queries.test.ts`

Expected: FAIL because `queries.ts` does not exist.

- [x] **Step 3: Centralize the Native server URL**

Create `apps/native/lib/server-url.ts`:

```ts
import { getServerUrl } from "@xhs/env/native";
import { Platform } from "react-native";

const defaultServerUrl = Platform.select({
	android: "http://10.0.2.2:3000",
	default: "http://localhost:3000",
});

export const nativeServerUrl = getServerUrl(defaultServerUrl).replace(/\/$/, "");
```

Update `auth-client.ts` to import `nativeServerUrl`, remove its duplicate `getServerUrl` and `Platform` imports/constants, and set `baseURL: nativeServerUrl`.

- [x] **Step 4: Create the typed oRPC client with auth-cookie forwarding**

```ts
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { apiContract } from "@xhs/api";
import { Platform } from "react-native";
import { authClient } from "./auth-client";
import { nativeServerUrl } from "./server-url";

const link = new RPCLink({
	url: `${nativeServerUrl}/rpc`,
	headers: () => {
		const cookie = Platform.OS === "web" ? "" : authClient.getCookie();
		return {
			"expo-origin": "xhs://",
			...(cookie ? { cookie } : {}),
		};
	},
	fetch: async (request) => {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10_000);
		const abortFromCaller = () => controller.abort();
		request.signal.addEventListener("abort", abortFromCaller, { once: true });

		try {
			return await fetch(
				new Request(request, {
					credentials: "include",
					signal: controller.signal,
				}),
			);
		} finally {
			clearTimeout(timeout);
			request.signal.removeEventListener("abort", abortFromCaller);
		}
	},
});

export const orpc: ContractRouterClient<typeof apiContract> =
	createORPCClient(link);
```

- [x] **Step 5: Implement stable list/detail query hooks**

```ts
import type { NoteListItem, NotesListOutput } from "@xhs/api";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";

export const notesKeys = {
	all: ["notes"] as const,
	list: () => [...notesKeys.all, "list"] as const,
	detail: (id: string) => [...notesKeys.all, "detail", id] as const,
};

export function flattenNotePages(
	pages: NotesListOutput[] | undefined,
): NoteListItem[] {
	const seen = new Set<string>();
	return (pages ?? []).flatMap((page) =>
		page.items.filter((note) => {
			if (seen.has(note.id)) return false;
			seen.add(note.id);
			return true;
		}),
	);
}

export function useNotesList() {
	return useInfiniteQuery({
		queryKey: notesKeys.list(),
		initialPageParam: undefined as string | undefined,
		queryFn: ({ pageParam }) =>
			orpc.notes.list({ cursor: pageParam, limit: 10 }),
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
}

export function useNote(id: string | null) {
	return useQuery({
		queryKey: notesKeys.detail(id ?? "invalid"),
		queryFn: () => orpc.notes.get({ id: id as string }),
		enabled: id !== null,
	});
}
```

- [x] **Step 6: Run query tests and Native type checks**

Run: `bun test apps/native/features/notes/queries.test.ts`

Expected: 2 PASS, 0 FAIL.

Run: `bun run --cwd apps/native check-types`

Expected: exit 0.

Run: `bunx biome check apps/native/lib/server-url.ts apps/native/lib/auth-client.ts apps/native/lib/orpc.ts apps/native/features/notes/queries.ts apps/native/features/notes/queries.test.ts`

Expected: no diagnostics.

- [ ] **Step 7: Commit checkpoint, only with explicit approval**

```bash
git add apps/native/lib/server-url.ts apps/native/lib/auth-client.ts apps/native/lib/orpc.ts apps/native/features/notes/queries.ts apps/native/features/notes/queries.test.ts
git commit -m "feat(native): add typed notes queries"
```

---

### Task 6: Replace the Home Placeholder with the Two-Column Feed

**Files:**
- Create: `apps/native/features/notes/note-card.tsx`
- Modify: `apps/native/app/(tabs)/index.tsx:1-93`

**Interfaces:**
- Consumes: `NoteListItem`, `useNotesList()`, `flattenNotePages()`, theme colors, existing publish gate.
- Produces: stable two-column cards, initial/empty/error/footer states, detail navigation.

- [x] **Step 1: Create a focused note card component**

Implement `NoteCard` with this exact public interface:

```ts
type NoteCardProps = {
	note: NoteListItem;
	onPress: (id: string) => void;
};
```

The component must be one `Pressable` containing:

```tsx
<Image source={{ uri: note.coverUrl }} style={styles.cover} resizeMode="cover" />
<View style={styles.copy}>
	<Text numberOfLines={2} style={[styles.cardTitle, { color: colors.foreground }]}>
		{note.title}
	</Text>
	<Text numberOfLines={1} style={[styles.author, { color: colors.muted }]}>
		{note.authorName}
	</Text>
</View>
```

Use these layout values: `borderRadius: 18`, `overflow: "hidden"`, `borderWidth: 1`, `cover.aspectRatio: 3 / 4`, `copy.padding: 10`, `copy.gap: 6`, title size 15/20 with weight 700, author size 12/16. The card receives half the available row width through the list column wrapper, not a hard-coded device width.

- [x] **Step 2: Replace the home empty card with a FlatList**

Keep the existing header and `openPublish` behavior. Add:

```ts
const query = useNotesList();
const notes = flattenNotePages(query.data?.pages);

const loadNextPage = () => {
	if (query.hasNextPage && !query.isFetchingNextPage) {
		void query.fetchNextPage();
	}
};
```

Render `FlatList` with:

```tsx
<FlatList
	data={notes}
	keyExtractor={(note) => note.id}
	numColumns={2}
	columnWrapperStyle={styles.row}
	contentContainerStyle={styles.listContent}
	renderItem={({ item }) => (
		<View style={styles.column}>
			<NoteCard
				note={item}
				onPress={(id) => router.push(`/note/${id}`)}
			/>
		</View>
	)}
	onEndReached={loadNextPage}
	onEndReachedThreshold={0.35}
	ListEmptyComponent={
		query.isPending ? (
			<FeedMessage title="正在加载内容" body="马上就好" />
		) : query.isError ? (
			<FeedMessage
				title="内容加载失败"
				body="请检查网络后重试"
				actionLabel="重新加载"
				onAction={() => void query.refetch()}
			/>
		) : (
			<FeedMessage title="还没有内容" body="稍后再来看看吧" />
		)
	}
	ListFooterComponent={
		query.isFetchingNextPage ? (
			<Text style={[styles.footer, { color: colors.muted }]}>正在加载更多</Text>
		) : query.isFetchNextPageError ? (
			<Pressable onPress={() => void query.fetchNextPage()}>
				<Text style={[styles.footer, { color: colors.accent }]}>加载失败，点击重试</Text>
			</Pressable>
		) : notes.length > 0 && !query.hasNextPage ? (
			<Text style={[styles.footer, { color: colors.muted }]}>已经到底了</Text>
		) : null
	}
/>
```

Define `FeedMessage` in the same file because it is page-specific. Set `styles.row` to `gap: 12`, `styles.column` to `flex: 1`, `styles.listContent` to `paddingBottom: 28` and `gap: 12`, and `styles.footer` to centered 13px text with 20px vertical padding.

- [x] **Step 3: Run focused verification**

Run: `bun run --cwd apps/native check-types`

Expected: exit 0.

Run: `bunx biome check 'apps/native/app/(tabs)/index.tsx' apps/native/features/notes/note-card.tsx`

Expected: no diagnostics.

- [x] **Step 4: Manually inspect the home screen**

With the server and Expo web client running, verify: header remains visible, cards have equal widths, covers stay 3:4, titles clamp to two lines, no like count is rendered, and the second page appends without duplicates or scroll jumps.

- [ ] **Step 5: Commit checkpoint, only with explicit approval**

```bash
git add 'apps/native/app/(tabs)/index.tsx' apps/native/features/notes/note-card.tsx
git commit -m "feat(native): render paginated two-column feed"
```

---

### Task 7: Add the Strictly Read-Only Detail Page

**Files:**
- Create: `apps/native/features/notes/note-route.ts`
- Create: `apps/native/features/notes/note-route.test.ts`
- Create: `apps/native/app/note/[id].tsx`
- Modify: `apps/native/app/_layout.tsx:13-26`

**Interfaces:**
- Consumes: Expo Router `id`, `useNote(id)`, `NoteDetail`, theme colors.
- Produces: normalized route ID and a public, non-interactive detail view.

- [x] **Step 1: Write a failing route-normalization test**

```ts
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
```

- [x] **Step 2: Run the test and verify the red state**

Run: `bun test apps/native/features/notes/note-route.test.ts`

Expected: FAIL because `note-route.ts` does not exist.

- [x] **Step 3: Implement route normalization**

```ts
export function normalizeNoteId(
	value: string | string[] | undefined,
): string | null {
	const id = Array.isArray(value) ? value[0] : value;
	return id && /^[1-9]\d*$/.test(id) ? id : null;
}
```

- [x] **Step 4: Implement the detail screen**

Use `useLocalSearchParams<{ id?: string | string[] }>()`, normalize the ID, and call `useNote(id)`. Render these exact states:

- Invalid ID: title `笔记地址无效`, body `请返回首页重新选择内容`.
- Initial loading: `正在加载笔记`.
- Query error: title `笔记加载失败`, body `内容可能不存在或网络暂时不可用`, button `重新加载`.
- Success: a `ScrollView` with `Image`, title, author, body, tags, and a non-interactive like summary.

The success content structure must be:

```tsx
<ScrollView style={{ backgroundColor: colors.background }}>
	<Image source={{ uri: note.imageUrl }} style={styles.hero} resizeMode="cover" />
	<View style={styles.content}>
		<Text style={[styles.title, { color: colors.foreground }]}>{note.title}</Text>
		<Text style={[styles.author, { color: colors.muted }]}>{note.authorName}</Text>
		<Text style={[styles.body, { color: colors.foreground }]}>{note.body}</Text>
		<View style={styles.tags}>
			{note.tags.map((tag) => (
				<View key={tag} style={[styles.tag, { backgroundColor: colors.surface }]}>
					<Text style={[styles.tagText, { color: colors.muted }]}>#{tag}</Text>
				</View>
			))}
		</View>
		<View style={[styles.likeSummary, { borderColor: colors.border }]}>
			<Text style={[styles.likeText, { color: colors.foreground }]}>
				{note.viewerHasLiked ? "已赞" : "点赞"} · {note.likeCount}
			</Text>
			<Text style={[styles.readonly, { color: colors.muted }]}>只读展示</Text>
		</View>
	</View>
</ScrollView>
```

The like summary must be `View`, never `Pressable`. Use `hero.width: "100%"`, `hero.aspectRatio: 3 / 4`, `content.padding: 20`, `content.gap: 14`, title size 26/34 weight 800, body size 16/27, wrapping tag row with 8px gap, and a rounded bordered like summary.

Add `<Stack.Screen name="note/[id]" />` inside the existing root Stack.

- [x] **Step 5: Run tests and focused checks**

Run: `bun test apps/native/features/notes/note-route.test.ts`

Expected: all route tests PASS.

Run: `bun run --cwd apps/native check-types`

Expected: exit 0.

Run: `bunx biome check 'apps/native/app/note/[id].tsx' apps/native/features/notes/note-route.ts apps/native/features/notes/note-route.test.ts apps/native/app/_layout.tsx`

Expected: no diagnostics.

- [x] **Step 6: Manually inspect strict read-only behavior**

Verify an unauthenticated user can open a detail page. Confirm the page contains no like `Pressable`, no sign-in navigation from the like summary, no mutation call, and no list like count.

- [ ] **Step 7: Commit checkpoint, only with explicit approval**

```bash
git add 'apps/native/app/note/[id].tsx' apps/native/app/_layout.tsx apps/native/features/notes/note-route.ts apps/native/features/notes/note-route.test.ts
git commit -m "feat(native): add read-only note details"
```

---

### Task 8: Run the Real D1/R2 Acceptance and Update P3 State

**Files:**
- Modify: `docs/specs/v1-portfolio-app/plan/P3.md`
- Modify: `docs/specs/v1-portfolio-app/workflow-state.md`

**Interfaces:**
- Consumes: all earlier tasks, local Alchemy D1/R2, existing `apps/server/.env` seed secret.
- Produces: fresh verification evidence and an `awaiting-human-review` P3 checkpoint.

- [x] **Step 1: Run all automated checks from a clean process state**

Run: `bun test`

Expected: all existing and new tests PASS, 0 FAIL.

Run: `bun run check-types`

Expected: all Turbo workspaces PASS.

Run: `bunx biome check packages/api/src apps/server/src apps/native/lib apps/native/features/notes 'apps/native/app/(tabs)/index.tsx' 'apps/native/app/note/[id].tsx' apps/native/app/_layout.tsx`

Expected: no diagnostics and no fixes applied.

Run from `apps/native`: `bunx expo install --check`

Expected: `Dependencies are up to date`.

- [x] **Step 2: Start the Worker and seed local D1/R2**

Run in terminal A: `bun run dev:server`

Expected: Alchemy applies the existing migration and the Worker listens on port 3000.

In terminal B, load the seed secret without printing it:

```bash
read -s P3_SEED_SECRET
curl --noproxy '*' -sS -X POST http://127.0.0.1:3000/api/dev/seed -H "x-seed-secret: ${P3_SEED_SECRET}"
unset P3_SEED_SECRET
```

Expected: JSON reports at least 16 notes; `skipped` may be either true or false.

- [x] **Step 3: Verify oRPC pagination and errors over HTTP**

Run:

```bash
curl --noproxy '*' -sS -X POST http://127.0.0.1:3000/rpc/notes/list -H 'content-type: application/json' -d '{"json":{"limit":10}}'
```

Expected: HTTP 200; `.json.items` has 10 entries in descending numeric ID order and `.json.nextCursor` is a string.

Capture the first page and request the second page:

```bash
P3_FIRST_PAGE=$(curl --noproxy '*' -sS -X POST http://127.0.0.1:3000/rpc/notes/list -H 'content-type: application/json' -d '{"json":{"limit":10}}')
P3_CURSOR=$(printf '%s' "${P3_FIRST_PAGE}" | jq -r '.json.nextCursor')
curl --noproxy '*' -sS -X POST http://127.0.0.1:3000/rpc/notes/list -H 'content-type: application/json' -d "{\"json\":{\"limit\":10,\"cursor\":\"${P3_CURSOR}\"}}"
unset P3_FIRST_PAGE P3_CURSOR
```

Expected: second page contains the remaining seed notes and returns `nextCursor: null` when no later records exist.

Run invalid input and unknown detail probes:

```bash
curl --noproxy '*' -sS -o /dev/null -w '%{http_code}\n' -X POST http://127.0.0.1:3000/rpc/notes/list -H 'content-type: application/json' -d '{"json":{"cursor":"bad","limit":10}}'
curl --noproxy '*' -sS -o /dev/null -w '%{http_code}\n' -X POST http://127.0.0.1:3000/rpc/notes/get -H 'content-type: application/json' -d '{"json":{"id":"999999"}}'
```

Expected: 400 then 404.

- [x] **Step 4: Verify detail and public R2 images**

Run:

```bash
curl --noproxy '*' -sS -X POST http://127.0.0.1:3000/rpc/notes/get -H 'content-type: application/json' -d '{"json":{"id":"1"}}'
curl --noproxy '*' -sS -o /dev/null -w '%{http_code} %{content_type}\n' http://127.0.0.1:3000/images/seed/note-01.png
```

Expected: detail includes all contract fields, `viewerHasLiked: false`, a nonnegative `likeCount`, and an absolute image URL; image request returns 200 with `content-type: image/png`.

- [x] **Step 5: Verify the Native/Web user path**

Run in terminal C: `bun run dev:native`

Verify this sequence without logging in:

1. Cold start lands on 首页 and shows real seed cards.
2. Scroll loads the second page once, without duplicates or visible jump.
3. Open a card and confirm image, title, author, body, tags, and count match the API response.
4. Confirm the like summary cannot be pressed and does not navigate.
5. Confirm loading, failed-request retry, and missing-detail states use Chinese copy.
6. Confirm the browser console or Metro output contains no new runtime error.
7. Capture one home-feed screenshot and one detail screenshot for the P3 review evidence.

- [x] **Step 6: Update stage documentation with observed evidence**

In `plan/P3.md`, mark only checklist items proven by Steps 1–5. In `workflow-state.md`:

- Change current stage to `P3（oRPC 只读信息流 + 详情）—— awaiting-human-review`.
- Record exact test counts, type-check workspace counts, Expo dependency result, RPC pagination result, image result, and UI acceptance platform/port.
- Move P2 to completed while retaining its evidence.
- Keep P4 as pending.

- [x] **Step 7: Run final diff and documentation checks**

Run: `git diff --check`

Expected: no whitespace errors.

Run: `git status --short`

Expected: only P3 implementation, tests, design/plan docs, and workflow files are modified or untracked.

Run the same full commands from Step 1 again after documentation edits.

Expected: all results remain green.

- [ ] **Step 8: Commit checkpoint, only with explicit approval**

```bash
git add docs/superpowers/specs/2026-08-12-p3-readonly-feed-design.md docs/superpowers/plans/2026-08-12-p3-readonly-feed.md docs/specs/v1-portfolio-app/plan/P3.md docs/specs/v1-portfolio-app/workflow-state.md
git commit -m "docs(p3): record readonly feed acceptance"
```

Do not claim P3 is complete beyond `awaiting-human-review` until the user reviews the evidence.
