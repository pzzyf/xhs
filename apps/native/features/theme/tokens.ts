import { DarkTheme, DefaultTheme, type Theme } from "@react-navigation/native";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export type ThemeTokens = {
	accent: string;
	accentForeground: string;
	background: string;
	border: string;
	danger: string;
	foreground: string;
	muted: string;
	surface: string;
	surfaceForeground: string;
};

export const themeTokens: Record<ResolvedTheme, ThemeTokens> = {
	light: {
		accent: "#f25555",
		accentForeground: "#ffffff",
		background: "#fbfaf8",
		border: "#e8e4de",
		danger: "#c2362a",
		foreground: "#202124",
		muted: "#5f6368",
		surface: "#ffffff",
		surfaceForeground: "#202124",
	},
	dark: {
		accent: "#ff6b6b",
		accentForeground: "#ffffff",
		background: "#121212",
		border: "#2c2c2e",
		danger: "#e05b5b",
		foreground: "#f5f5f5",
		muted: "#9e9e9e",
		surface: "#1c1c1e",
		surfaceForeground: "#f5f5f5",
	},
};

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
