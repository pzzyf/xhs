import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { NoteDetail, NotesListOutput } from "@xhs/api";

interface RequestOptions {
	signal?: AbortSignal;
}

export interface NotesClient {
	notes: {
		list(
			input: { cursor?: string; limit: number },
			options?: RequestOptions,
		): Promise<NotesListOutput>;
		get(input: { id: string }, options?: RequestOptions): Promise<NoteDetail>;
	};
}

export const notesKeys = {
	all: ["notes"] as const,
	list: () => [...notesKeys.all, "list"] as const,
	detail: (id: string) => [...notesKeys.all, "detail", id] as const,
};

export function notesListQueryOptions(client: NotesClient) {
	return infiniteQueryOptions({
		queryKey: notesKeys.list(),
		initialPageParam: undefined as string | undefined,
		queryFn: ({ pageParam, signal }) =>
			client.notes.list({ cursor: pageParam, limit: 10 }, { signal }),
		getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
	});
}

export function noteQueryOptions(client: NotesClient, id: string | null) {
	return queryOptions({
		queryKey: notesKeys.detail(id ?? "invalid"),
		queryFn: ({ signal }) => client.notes.get({ id: id as string }, { signal }),
		enabled: id !== null,
	});
}
