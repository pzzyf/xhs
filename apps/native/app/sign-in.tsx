import { useRouter } from "expo-router";
import { useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { type AuthMode, validateAuthForm } from "@/features/auth/auth-form";
import { useAuth } from "@/features/auth/auth-provider";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/providers/theme-provider";

export default function SignInScreen() {
	const router = useRouter();
	const { refreshSession } = useAuth();
	const { colors } = useTheme();
	const [mode, setMode] = useState<AuthMode>("sign-in");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const switchMode = (nextMode: AuthMode) => {
		setMode(nextMode);
		setErrorMessage(null);
	};

	const submit = async () => {
		const validation = validateAuthForm({ mode, name, email, password });
		if (!validation.ok) {
			setErrorMessage(validation.message);
			return;
		}

		setIsSubmitting(true);
		setErrorMessage(null);

		try {
			const result =
				mode === "sign-up"
					? await authClient.signUp.email({
							name: validation.data.name,
							email: validation.data.email,
							password: validation.data.password,
						})
					: await authClient.signIn.email({
							email: validation.data.email,
							password: validation.data.password,
						});

			if (result.error) {
				setErrorMessage(
					mode === "sign-up"
						? "注册失败，邮箱可能已被使用"
						: "登录失败，请检查邮箱和密码",
				);
				return;
			}

			await refreshSession();
			router.replace("/");
		} catch {
			setErrorMessage("网络开小差了，请稍后再试");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<SafeAreaView
			style={[styles.safeArea, { backgroundColor: colors.background }]}
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={styles.flex}
			>
				<ScrollView
					contentContainerStyle={styles.content}
					keyboardShouldPersistTaps="handled"
				>
					<Pressable onPress={() => router.back()} style={styles.backButton}>
						<Text style={[styles.backText, { color: colors.muted }]}>返回</Text>
					</Pressable>

					<View style={styles.heading}>
						<Text style={[styles.eyebrow, { color: colors.accent }]}>
							灵感社区
						</Text>
						<Text style={[styles.title, { color: colors.foreground }]}>
							欢迎回来
						</Text>
						<Text style={[styles.subtitle, { color: colors.muted }]}>
							登录后即可发布作品和点赞
						</Text>
					</View>

					<View
						style={[
							styles.card,
							{ backgroundColor: colors.surface, borderColor: colors.border },
						]}
					>
						<View
							style={[styles.segment, { backgroundColor: colors.background }]}
						>
							{(["sign-in", "sign-up"] as const).map((item) => {
								const active = mode === item;
								return (
									<Pressable
										key={item}
										onPress={() => switchMode(item)}
										style={[
											styles.segmentButton,
											active && { backgroundColor: colors.surface },
										]}
									>
										<Text
											style={[
												styles.segmentText,
												{ color: active ? colors.foreground : colors.muted },
											]}
										>
											{item === "sign-in" ? "登录" : "注册"}
										</Text>
									</Pressable>
								);
							})}
						</View>

						{mode === "sign-up" ? (
							<View style={styles.field}>
								<Text style={[styles.label, { color: colors.foreground }]}>
									昵称
								</Text>
								<TextInput
									autoCapitalize="none"
									onChangeText={setName}
									placeholder="怎么称呼你"
									placeholderTextColor={colors.muted}
									style={[
										styles.input,
										{ color: colors.foreground, borderColor: colors.border },
									]}
									value={name}
								/>
							</View>
						) : null}

						<View style={styles.field}>
							<Text style={[styles.label, { color: colors.foreground }]}>
								邮箱
							</Text>
							<TextInput
								autoCapitalize="none"
								autoComplete="email"
								keyboardType="email-address"
								onChangeText={setEmail}
								placeholder="name@example.com"
								placeholderTextColor={colors.muted}
								style={[
									styles.input,
									{ color: colors.foreground, borderColor: colors.border },
								]}
								value={email}
							/>
						</View>

						<View style={styles.field}>
							<Text style={[styles.label, { color: colors.foreground }]}>
								密码
							</Text>
							<TextInput
								autoCapitalize="none"
								autoComplete={
									mode === "sign-in" ? "current-password" : "new-password"
								}
								onChangeText={setPassword}
								placeholder="至少 8 位"
								placeholderTextColor={colors.muted}
								secureTextEntry
								style={[
									styles.input,
									{ color: colors.foreground, borderColor: colors.border },
								]}
								value={password}
							/>
						</View>

						{errorMessage ? (
							<Text style={styles.errorText}>{errorMessage}</Text>
						) : null}

						<Pressable
							disabled={isSubmitting}
							onPress={submit}
							style={({ pressed }) => [
								styles.submitButton,
								{ backgroundColor: colors.accent },
								(pressed || isSubmitting) && styles.buttonPressed,
							]}
						>
							<Text style={styles.submitText}>
								{isSubmitting
									? "请稍候…"
									: mode === "sign-in"
										? "登录"
										: "创建账号"}
							</Text>
						</Pressable>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	flex: { flex: 1 },
	safeArea: { flex: 1 },
	content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },
	backButton: { alignSelf: "flex-start", paddingVertical: 12 },
	backText: { fontSize: 15 },
	heading: { marginBottom: 28, marginTop: 32 },
	eyebrow: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
	title: { fontSize: 34, fontWeight: "800", letterSpacing: -0.8 },
	subtitle: { fontSize: 16, lineHeight: 24, marginTop: 10 },
	card: { borderRadius: 24, borderWidth: 1, gap: 18, padding: 20 },
	segment: { borderRadius: 14, flexDirection: "row", padding: 4 },
	segmentButton: {
		alignItems: "center",
		borderRadius: 11,
		flex: 1,
		paddingVertical: 10,
	},
	segmentText: { fontSize: 15, fontWeight: "700" },
	field: { gap: 8 },
	label: { fontSize: 14, fontWeight: "600" },
	input: {
		borderRadius: 14,
		borderWidth: 1,
		fontSize: 16,
		paddingHorizontal: 14,
		paddingVertical: 13,
	},
	errorText: { color: "#c0392b", fontSize: 14, lineHeight: 20 },
	submitButton: {
		alignItems: "center",
		borderRadius: 14,
		marginTop: 2,
		paddingVertical: 15,
	},
	buttonPressed: { opacity: 0.7 },
	submitText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
});
