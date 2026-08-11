import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider as NavigationThemeProvider,
	type Theme,
} from "@react-navigation/native";
import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useMemo,
} from "react";
import { useColorScheme } from "react-native";
import { Uniwind } from "uniwind";

export type ResolvedTheme = "light" | "dark";

export const themeTokens = {
	light: {
		background: "#fbfaf8",
		foreground: "#202124",
		surface: "#ffffff",
		muted: "#5f6368",
		accent: "#16a085",
		border: "#e8e4de",
	},
	dark: {
		background: "#121212",
		foreground: "#f5f5f5",
		surface: "#1c1c1e",
		muted: "#9e9e9e",
		accent: "#1abc9c",
		border: "#2c2c2e",
	},
} as const;

export const navigationThemes: Record<ResolvedTheme, Theme> = {
	light: {
		...DefaultTheme,
		colors: {
			...DefaultTheme.colors,
			background: themeTokens.light.background,
			border: themeTokens.light.border,
			card: themeTokens.light.surface,
			notification: themeTokens.light.accent,
			primary: themeTokens.light.accent,
			text: themeTokens.light.foreground,
		},
	},
	dark: {
		...DarkTheme,
		colors: {
			...DarkTheme.colors,
			background: themeTokens.dark.background,
			border: themeTokens.dark.border,
			card: themeTokens.dark.surface,
			notification: themeTokens.dark.accent,
			primary: themeTokens.dark.accent,
			text: themeTokens.dark.foreground,
		},
	},
};

type ThemeContextValue = {
	colors: (typeof themeTokens)[ResolvedTheme];
	resolvedScheme: ResolvedTheme;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
	const systemScheme = useColorScheme();
	const resolvedScheme: ResolvedTheme =
		systemScheme === "dark" ? "dark" : "light";

	useEffect(() => {
		Uniwind.setTheme(resolvedScheme);
	}, [resolvedScheme]);

	const value = useMemo(
		() => ({ colors: themeTokens[resolvedScheme], resolvedScheme }),
		[resolvedScheme],
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
