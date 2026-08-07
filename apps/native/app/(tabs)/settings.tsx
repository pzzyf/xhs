import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGuestSession } from "@/features/auth/guest-session-provider";
import type { ThemePreference, ThemeTokens } from "@/features/theme/tokens";
import { authClient, clearAuthTokenStorage } from "@/lib/auth-client";
import { useTheme } from "@/providers/theme-provider";

const themeOptions: Array<{ label: string; value: ThemePreference }> = [
	{ label: "跟随系统", value: "system" },
	{ label: "浅色", value: "light" },
	{ label: "深色", value: "dark" },
];

export default function SettingsScreen() {
	const { colors, preference, resolvedScheme, setPreference } = useTheme();
	const styles = createStyles(colors);
	const resolvedLabel = resolvedScheme === "dark" ? "深色" : "浅色";
	const { data: session } = authClient.useSession();
	const { exitGuest } = useGuestSession();
	const [signingOut, setSigningOut] = useState(false);

	async function signOut() {
		setSigningOut(true);
		try {
			if (session) {
				await authClient.signOut();
			}
			await exitGuest();
		} finally {
			await clearAuthTokenStorage();
			setSigningOut(false);
			router.replace("/sign-in");
		}
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.content}>
				<Text style={styles.eyebrow}>XHS Native</Text>
				<Text style={styles.title}>设置</Text>
				<Text style={styles.body}>
					主题：
					{preference === "system"
						? `跟随系统（${resolvedLabel}）`
						: resolvedLabel}
				</Text>

				<View style={styles.section}>
					<Text style={styles.label}>主题</Text>
					{themeOptions.map((option) => {
						const selected = preference === option.value;

						return (
							<Pressable
								accessibilityRole="radio"
								accessibilityState={{ selected }}
								key={option.value}
								onPress={() => {
									setPreference(option.value);
								}}
								style={({ pressed }) => [
									styles.option,
									pressed ? styles.optionPressed : null,
								]}
							>
								<Text style={styles.optionLabel}>{option.label}</Text>
								{selected ? <View style={styles.optionIndicator} /> : null}
							</Pressable>
						);
					})}
				</View>

				<View style={styles.footer}>
					<Pressable
						accessibilityRole="button"
						disabled={signingOut}
						onPress={() => {
							void signOut();
						}}
						style={[
							styles.logoutButton,
							signingOut ? styles.logoutButtonDisabled : null,
						]}
					>
						<Text style={styles.logoutButtonText}>
							{signingOut ? "退出中…" : "退出登录"}
						</Text>
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}

function createStyles(colors: ThemeTokens) {
	return StyleSheet.create({
		body: {
			color: colors.muted,
			fontSize: 16,
			lineHeight: 24,
		},
		content: {
			gap: 12,
			padding: 20,
			paddingTop: 38,
		},
		eyebrow: {
			color: colors.accent,
			fontSize: 13,
			fontWeight: "700",
			textTransform: "uppercase",
		},
		footer: {
			marginTop: 28,
		},
		logoutButton: {
			alignItems: "center",
			borderColor: colors.border,
			borderRadius: 24,
			borderWidth: StyleSheet.hairlineWidth,
			minHeight: 50,
			justifyContent: "center",
		},
		logoutButtonDisabled: {
			opacity: 0.5,
		},
		logoutButtonText: {
			color: colors.danger,
			fontSize: 16,
			fontWeight: "700",
		},
		label: {
			color: colors.muted,
			fontSize: 13,
			fontWeight: "700",
			textTransform: "uppercase",
		},
		option: {
			alignItems: "center",
			backgroundColor: colors.surface,
			borderColor: colors.border,
			borderRadius: 8,
			borderWidth: StyleSheet.hairlineWidth,
			flexDirection: "row",
			justifyContent: "space-between",
			minHeight: 48,
			paddingHorizontal: 16,
		},
		optionIndicator: {
			backgroundColor: colors.accent,
			borderRadius: 6,
			height: 12,
			width: 12,
		},
		optionLabel: {
			color: colors.foreground,
			fontSize: 16,
		},
		optionPressed: {
			opacity: 0.7,
		},
		safeArea: {
			backgroundColor: colors.background,
			flex: 1,
		},
		section: {
			gap: 10,
			marginTop: 10,
		},
		title: {
			color: colors.foreground,
			fontSize: 32,
			fontWeight: "800",
			lineHeight: 38,
		},
	});
}
