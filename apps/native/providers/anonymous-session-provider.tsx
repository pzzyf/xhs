import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

const anonymousSessionStorageKey = "xhs.anonymous-session-id";

type AnonymousSessionContextValue = {
	id: string | null;
	isReady: boolean;
	reset: () => Promise<void>;
};

const AnonymousSessionContext = createContext<
	AnonymousSessionContextValue | undefined
>(undefined);

async function createAndPersistSession() {
	const id = Crypto.randomUUID();

	try {
		await SecureStore.setItemAsync(anonymousSessionStorageKey, id);
	} catch {
		// Keep the in-memory session usable when secure storage is unavailable.
	}

	return id;
}

export function AnonymousSessionProvider({ children }: PropsWithChildren) {
	const [id, setId] = useState<string | null>(null);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		let isActive = true;

		async function loadSession() {
			let storedId: string | null = null;

			try {
				storedId = await SecureStore.getItemAsync(anonymousSessionStorageKey);
			} catch {
				// Fall back to an in-memory ID below.
			}

			const sessionId = storedId ?? (await createAndPersistSession());

			if (isActive) {
				setId(sessionId);
				setIsReady(true);
			}
		}

		void loadSession();

		return () => {
			isActive = false;
		};
	}, []);

	const reset = useCallback(async () => {
		const sessionId = await createAndPersistSession();
		setId(sessionId);
	}, []);

	const value = useMemo(
		() => ({
			id,
			isReady,
			reset,
		}),
		[id, isReady, reset],
	);

	return (
		<AnonymousSessionContext.Provider value={value}>
			{children}
		</AnonymousSessionContext.Provider>
	);
}

export function useAnonymousSession() {
	const session = useContext(AnonymousSessionContext);

	if (session === undefined) {
		throw new Error(
			"useAnonymousSession must be used inside AnonymousSessionProvider",
		);
	}

	return session;
}
