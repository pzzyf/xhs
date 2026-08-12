import type { NoteDetail, NotesListOutput } from "@xhs/api";
import { type Database, likes, notes, user } from "@xhs/db";
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

export function createNotesService(db: Database, origin: string): NotesService {
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
