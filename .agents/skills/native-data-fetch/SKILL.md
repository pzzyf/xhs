---
name: native-data-fetch
description: Add or update mobile-ready data fetching in Expo or React Native apps using TanStack Query. Use when Codex needs to install/configure @tanstack/react-query, add QueryClientProvider, wire React Native AppState focus handling, wire NetInfo online handling, create API helpers/query hooks, migrate ad hoc fetch calls, or make query behavior work across iOS, Android, simulators, devices, and React Native Web.
---

# Native Data Fetch

## Workflow

1. Inspect the app entry point, router layout, package manager, TypeScript config, and existing data-fetching patterns.
2. Install missing dependencies with the repo's package manager:
   - `@tanstack/react-query`
   - `@react-native-community/netinfo` for native online/offline state
3. Add one app-level Query provider close to the root layout. Keep the `QueryClient` stable with `useState(createQueryClient)`.
4. Bridge mobile environment state:
   - Use `AppState` to call `focusManager.setFocused(status === "active")`.
   - Use `NetInfo.addEventListener` to call `onlineManager.setOnline(...)`.
   - Skip those native bridges on `Platform.OS === "web"` and let TanStack Query use web defaults.
5. Add a small API client/helper instead of scattering raw `fetch` calls through screens.
6. Put query keys and query functions near the feature that consumes them.
7. Update screens to use `useQuery`, `useMutation`, invalidation, pull-to-refresh, loading, empty, and error states as appropriate.
8. Validate with typecheck, formatter/linter, and Expo dependency checks when available.

## Provider Pattern

Use this shape unless the repo already has a compatible provider system:

```tsx
import NetInfo from "@react-native-community/netinfo";
import {
	focusManager,
	onlineManager,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { type PropsWithChildren, useEffect, useState } from "react";
import { AppState, Platform } from "react-native";

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				gcTime: 5 * 60 * 1000,
				refetchOnReconnect: true,
				refetchOnWindowFocus: true,
				retry: 2,
				staleTime: 30 * 1000,
			},
		},
	});
}

function QueryEnvironmentObserver() {
	useEffect(() => {
		if (Platform.OS === "web") return;

		focusManager.setFocused(AppState.currentState === "active");
		const subscription = AppState.addEventListener("change", (status) => {
			focusManager.setFocused(status === "active");
		});

		return () => subscription.remove();
	}, []);

	useEffect(() => {
		if (Platform.OS === "web") return;

		return NetInfo.addEventListener((state) => {
			onlineManager.setOnline(
				Boolean(state.isConnected && state.isInternetReachable !== false),
			);
		});
	}, []);

	return null;
}

export function AppQueryProvider({ children }: PropsWithChildren) {
	const [queryClient] = useState(createQueryClient);

	return (
		<QueryClientProvider client={queryClient}>
			<QueryEnvironmentObserver />
			{children}
		</QueryClientProvider>
	);
}
```

## API Client Pattern

Prefer an environment-aware base URL. Android emulators cannot reach the host machine through `localhost`.

```ts
import { Platform } from "react-native";

const defaultApiBaseUrl = Platform.select({
	android: "http://10.0.2.2:3000",
	default: "http://localhost:3000",
});

export const apiBaseUrl = (
	process.env.EXPO_PUBLIC_API_URL ?? defaultApiBaseUrl
).replace(/\/$/, "");

type ApiPath = `/${string}`;

export class ApiError extends Error {
	readonly body: string;
	readonly status: number;

	constructor(response: Response, body: string) {
		super(`Request failed: ${response.status} ${response.statusText}`);
		this.name = "ApiError";
		this.body = body;
		this.status = response.status;
	}
}

export async function apiText(path: ApiPath, init?: RequestInit) {
	const response = await fetch(`${apiBaseUrl}${path}`, init);
	const body = await response.text();

	if (!response.ok) {
		throw new ApiError(response, body);
	}

	return body;
}
```

For JSON APIs, create an `apiJson<T>()` helper with an `Accept: application/json` header and typed return value. Keep path typing strict enough to catch missing leading slashes.

## Query Organization

Use stable tuple query keys and feature-local query functions:

```ts
import { apiText } from "../../lib/api";

export const homeGreetingQueryKey = ["home", "greeting"] as const;

export function getHomeGreeting() {
	return apiText("/");
}
```

On screens:

- Use `useQuery({ queryKey, queryFn })`.
- Use `RefreshControl` or an explicit button for `refetch()`/`invalidateQueries()`.
- Show mobile-appropriate loading, error, empty, and stale-refresh states.
- Avoid browser-only assumptions such as window focus events in native-only code.
- Prefer invalidating feature query keys after mutations instead of manually editing unrelated cache entries.

## Validation

Run the checks that exist in the repo, scoped when the worktree has unrelated changes:

```bash
bun run check-types
bunx biome check apps/native/src apps/native/package.json
bunx expo install --check
```

If the project uses npm, pnpm, yarn, or another lint/typecheck command, use the local scripts instead. When testing on devices, verify `EXPO_PUBLIC_API_URL` points to a reachable LAN or HTTPS URL rather than simulator-only localhost.
