import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/lib/orpc";

export const myNotesKeys = {
	all: ["me", "notes"] as const,
};

export function useMyNotes() {
	return useQuery({
		queryKey: myNotesKeys.all,
		queryFn: () => orpc.me.notes(),
	});
}
