import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { NoteListItem, NotesListOutput } from "@xhs/api";

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
		queryFn: async ({ pageParam }) => {
			const { orpc } = await import("@/lib/orpc");
			return orpc.notes.list({ cursor: pageParam, limit: 10 });
		},
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
}

export function useNote(id: string | null) {
	return useQuery({
		queryKey: notesKeys.detail(id ?? "invalid"),
		queryFn: async () => {
			const { orpc } = await import("@/lib/orpc");
			return orpc.notes.get({ id: id as string });
		},
		enabled: id !== null,
	});
}
