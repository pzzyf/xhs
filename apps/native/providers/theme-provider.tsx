import { ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
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
import { Platform, useColorScheme } from "react-native";
import { Uniwind } from "uniwind";

import {
	navigationThemes,
	type ResolvedTheme,
	type ThemePreference,
	themeTokens,
} from "@/features/theme/tokens";

const themePreferenceStorageKey = "xhs.theme-preference";

type ThemeContextValue = {
	colors: (typeof themeTokens)[ResolvedTheme];
	preference: ThemePreference;
	resolvedScheme: ResolvedTheme;
	setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const webStorage = globalThis as typeof globalThis & {
	localStorage?: {
		getItem(key: string): string | null;
		setItem(key: string, value: string): void;
	};
};

function isThemePreference(value: string | null): value is ThemePreference {
	return value === "system" || value === "light" || value === "dark";
}

async function readStoredPreference(): Promise<ThemePreference | null> {
	try {
		const stored =
			Platform.OS === "web"
				? (webStorage.localStorage?.getItem(themePreferenceStorageKey) ?? null)
				: await SecureStore.getItemAsync(themePreferenceStorageKey);

		return isThemePreference(stored) ? stored : null;
	} catch {
		return null;
	}
}

async function persistPreference(preference: ThemePreference) {
	try {
		if (Platform.OS === "web") {
			webStorage.localStorage?.setItem(themePreferenceStorageKey, preference);
		} else {
			await SecureStore.setItemAsync(themePreferenceStorageKey, preference);
		}
	} catch {
		// Storage unavailable; keep the in-memory preference.
	}
}

export function ThemeProvider({ children }: PropsWithChildren) {
	const systemScheme = useColorScheme();
	const [preference, setPreferenceState] = useState<ThemePreference>("system");

	useEffect(() => {
		let isActive = true;

		void readStoredPreference().then((stored) => {
			if (isActive && stored !== null) {
				setPreferenceState(stored);
			}
		});

		return () => {
			isActive = false;
		};
	}, []);

	useEffect(() => {
		Uniwind.setTheme(preference);
	}, [preference]);

	const setPreference = useCallback((next: ThemePreference) => {
		setPreferenceState(next);
		void persistPreference(next);
	}, []);

	const resolvedScheme: ResolvedTheme =
		preference === "system"
			? systemScheme === "dark"
				? "dark"
				: "light"
			: preference;

	const value = useMemo(
		() => ({
			colors: themeTokens[resolvedScheme],
			preference,
			resolvedScheme,
			setPreference,
		}),
		[preference, resolvedScheme, setPreference],
	);

	return (
		<ThemeContext.Provider value={value}>
			<NavigationThemeProvider value={navigationThemes[resolvedScheme]}>
				{children}
			</NavigationThemeProvider>
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const theme = useContext(ThemeContext);

	if (theme === undefined) {
		throw new Error("useTheme must be used inside ThemeProvider");
	}

	return theme;
}
