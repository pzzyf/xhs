import { router } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackHeader } from "@/components/back-header";
import { useGuestSession } from "@/features/auth/guest-session-provider";
import type { ThemeTokens } from "@/features/theme/tokens";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/providers/theme-provider";

type Mode = "sign-in" | "sign-up";

export default function SignInScreen() {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const { enterAsGuest, exitGuest } = useGuestSession();
	const [mode, setMode] = useState<Mode>("sign-in");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function submit() {
		if (submitting) {
			return;
		}

		setSubmitting(true);
		setError(null);

		const result =
			mode === "sign-in"
				? await authClient.signIn.email({ email, password })
				: await authClient.signUp.email({
						email,
						name: name.trim(),
						password,
					});

		setSubmitting(false);

		if (result.error) {
			setError(result.error.message ?? "操作失败，请稍后重试");
			return;
		}

		await exitGuest();
		router.replace("/");
	}

	const canSubmit =
		email.trim().length > 0 &&
		password.length >= 6 &&
		(mode === "sign-in" || name.trim().length > 0);

	return (
		<SafeAreaView style={styles.safeArea}>
			<BackHeader
				onBack={
					mode === "sign-up"
						? () => {
								setMode("sign-in");
								setError(null);
							}
						: undefined
				}
				showBack={mode === "sign-up"}
				title={mode === "sign-in" ? "登录" : "注册"}
			/>
			<View style={styles.content}>
				<Text style={styles.eyebrow}>Better Auth</Text>
				<Text style={styles.title}>
					{mode === "sign-in" ? "欢迎回来" : "创建账号"}
				</Text>
				<Text style={styles.body}>
					{mode === "sign-in"
						? "使用邮箱和密码登录，与匿名会话并存。"
						: "注册后即可用邮箱密码登录。"}
				</Text>

				<View style={styles.form}>
					{mode === "sign-up" ? (
						<TextInput
							autoCapitalize="words"
							autoCorrect={false}
							onChangeText={setName}
							placeholder="昵称"
							placeholderTextColor={colors.muted}
							style={styles.input}
							value={name}
						/>
					) : null}
					<TextInput
						autoCapitalize="none"
						autoCorrect={false}
						keyboardType="email-address"
						onChangeText={setEmail}
						placeholder="邮箱"
						placeholderTextColor={colors.muted}
						style={styles.input}
						value={email}
					/>
					<TextInput
						autoCapitalize="none"
						autoCorrect={false}
						onChangeText={setPassword}
						placeholder="密码（至少 6 位）"
						placeholderTextColor={colors.muted}
						secureTextEntry
						style={styles.input}
						value={password}
					/>

					{error ? <Text style={styles.error}>{error}</Text> : null}

					<Pressable
						accessibilityRole="button"
						disabled={!canSubmit || submitting}
						onPress={() => {
							void submit();
						}}
						style={[
							styles.primaryButton,
							!canSubmit || submitting ? styles.buttonDisabled : null,
						]}
					>
						{submitting ? (
							<ActivityIndicator color={colors.accentForeground} />
						) : (
							<Text style={styles.primaryButtonText}>
								{mode === "sign-in" ? "登录" : "注册"}
							</Text>
						)}
					</Pressable>

					<Pressable
						accessibilityRole="button"
						disabled={submitting}
						onPress={() => {
							setMode((current) =>
								current === "sign-in" ? "sign-up" : "sign-in",
							);
							setError(null);
						}}
						style={styles.switchButton}
					>
						<Text style={styles.switchButtonText}>
							{mode === "sign-in" ? "没有账号？去注册" : "已有账号？去登录"}
						</Text>
					</Pressable>

					<View style={styles.guestSection}>
						<Pressable
							accessibilityRole="button"
							disabled={submitting}
							onPress={() => {
								void (async () => {
									await enterAsGuest();
									router.replace("/");
								})();
							}}
							style={styles.guestButton}
						>
							<Text style={styles.guestButtonText}>游客登录</Text>
						</Pressable>
						<Text style={styles.guestHint}>无需注册，直接以游客身份进入</Text>
					</View>
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
		buttonDisabled: {
			opacity: 0.45,
		},
		content: {
			gap: 12,
			padding: 20,
			paddingTop: 30,
		},
		error: {
			color: colors.danger,
			fontSize: 14,
			lineHeight: 20,
		},
		eyebrow: {
			color: colors.accent,
			fontSize: 13,
			fontWeight: "700",
			textTransform: "uppercase",
		},
		form: {
			gap: 14,
			marginTop: 16,
		},
		guestButton: {
			alignItems: "center",
			borderColor: colors.border,
			borderRadius: 24,
			borderWidth: StyleSheet.hairlineWidth,
			minHeight: 50,
			justifyContent: "center",
		},
		guestButtonText: {
			color: colors.accent,
			fontSize: 16,
			fontWeight: "700",
		},
		guestHint: {
			color: colors.muted,
			fontSize: 13,
			lineHeight: 19,
			textAlign: "center",
		},
		guestSection: {
			gap: 8,
			marginTop: 8,
		},
		input: {
			backgroundColor: colors.surface,
			borderColor: colors.border,
			borderRadius: 10,
			borderWidth: StyleSheet.hairlineWidth,
			color: colors.foreground,
			fontSize: 16,
			minHeight: 50,
			paddingHorizontal: 14,
		},
		primaryButton: {
			alignItems: "center",
			backgroundColor: colors.accent,
			borderRadius: 24,
			minHeight: 50,
			justifyContent: "center",
			marginTop: 6,
		},
		primaryButtonText: {
			color: colors.accentForeground,
			fontSize: 16,
			fontWeight: "700",
		},
		safeArea: {
			backgroundColor: colors.background,
			flex: 1,
		},
		switchButton: {
			alignItems: "center",
			minHeight: 44,
			justifyContent: "center",
		},
		switchButtonText: {
			color: colors.accent,
			fontSize: 15,
			fontWeight: "600",
		},
		title: {
			color: colors.foreground,
			fontSize: 30,
			fontWeight: "800",
			lineHeight: 36,
		},
	});
}
