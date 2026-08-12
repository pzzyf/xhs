import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { noteQueryOptions, notesListQueryOptions } from "./query-options";

export { flattenNotePages } from "./note-pages";
export { notesKeys } from "./query-options";

export function useNotesList() {
	return useInfiniteQuery(notesListQueryOptions(orpc));
}

export function useNote(id: string | null) {
	return useQuery(noteQueryOptions(orpc, id));
}
