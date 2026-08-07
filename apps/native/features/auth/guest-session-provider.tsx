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
import { Platform } from "react-native";

const guestStorageKey = "xhs.guest-login";

type GuestSessionContextValue = {
	enterAsGuest: () => Promise<void>;
	exitGuest: () => Promise<void>;
	isGuest: boolean;
	isReady: boolean;
};

const GuestSessionContext = createContext<GuestSessionContextValue | undefined>(
	undefined,
);

async function readStoredGuest() {
	if (Platform.OS === "web") {
		return typeof localStorage === "undefined"
			? false
			: localStorage.getItem(guestStorageKey) === "1";
	}

	try {
		return (await SecureStore.getItemAsync(guestStorageKey)) === "1";
	} catch {
		return false;
	}
}

async function writeStoredGuest(value: boolean) {
	if (Platform.OS === "web") {
		if (typeof localStorage !== "undefined") {
			if (value) {
				localStorage.setItem(guestStorageKey, "1");
			} else {
				localStorage.removeItem(guestStorageKey);
			}
		}
		return;
	}

	try {
		if (value) {
			await SecureStore.setItemAsync(guestStorageKey, "1");
		} else {
			await SecureStore.deleteItemAsync(guestStorageKey);
		}
	} catch {
		// 存储不可用时，内存状态仍然生效。
	}
}

export function GuestSessionProvider({ children }: PropsWithChildren) {
	const [isGuest, setIsGuest] = useState(false);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		let isActive = true;

		void readStoredGuest().then((stored) => {
			if (!isActive) {
				return;
			}

			setIsGuest(stored);
			setIsReady(true);
		});

		return () => {
			isActive = false;
		};
	}, []);

	const enterAsGuest = useCallback(async () => {
		setIsGuest(true);
		setIsReady(true);
		await writeStoredGuest(true);
	}, []);

	const exitGuest = useCallback(async () => {
		setIsGuest(false);
		await writeStoredGuest(false);
	}, []);

	const value = useMemo(
		() => ({
			enterAsGuest,
			exitGuest,
			isGuest,
			isReady,
		}),
		[enterAsGuest, exitGuest, isGuest, isReady],
	);

	return (
		<GuestSessionContext.Provider value={value}>
			{children}
		</GuestSessionContext.Provider>
	);
}

export function useGuestSession() {
	const session = useContext(GuestSessionContext);

	if (session === undefined) {
		throw new Error("useGuestSession must be used inside GuestSessionProvider");
	}

	return session;
}
