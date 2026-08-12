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

export const notesCreateInputSchema = z.object({
	title: z.string().trim().min(1).max(40),
	body: z.string().trim().min(1).max(2000),
	tags: z.array(z.string().trim().min(1).max(20)).max(5),
	imageKey: z.string().min(1).max(200),
});

export const likesToggleInputSchema = z.object({
	noteId: positiveIdStringSchema,
});

export const likesToggleOutputSchema = z.object({
	liked: z.boolean(),
	likeCount: z.number().int().nonnegative(),
});

export const meProfileOutputSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	image: z.string().nullable(),
});

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

export const notesCreateContract = oc
	.input(notesCreateInputSchema)
	.output(noteDetailSchema);

export const likesToggleContract = oc
	.input(likesToggleInputSchema)
	.output(likesToggleOutputSchema);

export const meNotesContract = oc.output(z.array(noteListItemSchema));

export const meProfileContract = oc.output(meProfileOutputSchema);

export const apiContract = {
	health: healthContract,
	notes: {
		list: notesListContract,
		get: notesGetContract,
		create: notesCreateContract,
	},
	likes: {
		toggle: likesToggleContract,
	},
	me: {
		notes: meNotesContract,
		profile: meProfileContract,
	},
};

export type NoteListItem = z.infer<typeof noteListItemSchema>;
export type NoteDetail = z.infer<typeof noteDetailSchema>;
export type NoteCreateInput = z.infer<typeof notesCreateInputSchema>;
export type LikesToggleOutput = z.infer<typeof likesToggleOutputSchema>;
export type MeProfile = z.infer<typeof meProfileOutputSchema>;
export type NotesListOutput = {
	items: NoteListItem[];
	nextCursor: string | null;
};
