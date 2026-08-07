import { queryOptions } from "@tanstack/react-query";

import { orpc } from "@/lib/orpc";

export const homeGreetingQueryKey = ["home", "greeting"] as const;

export const homeGreetingCachePolicy = {
	gcTime: 10 * 60 * 1000,
	retry: 1,
	staleTime: 60 * 1000,
} as const;

export const homeGreetingQueryOptions = queryOptions({
	queryKey: homeGreetingQueryKey,
	queryFn: () => orpc.greeting({ name: "XHS Native" }),
	...homeGreetingCachePolicy,
});
