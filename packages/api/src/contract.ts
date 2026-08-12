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

export const notesListContract = oc.input(notesListInputSchema).output(
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
