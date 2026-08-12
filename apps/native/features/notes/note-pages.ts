import type { NoteListItem, NotesListOutput } from "@xhs/api";

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
