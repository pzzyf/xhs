import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthGate } from "@/features/auth/auth-gate";
import { useAuth } from "@/features/auth/auth-provider";
import { useTheme } from "@/providers/theme-provider";

export default function MeScreen() {
	const router = useRouter();
	const { colors } = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: colors.background }]}
		>
			<Text style={[styles.pageTitle, { color: colors.foreground }]}>我的</Text>
			<AuthGate
				fallback={
					<View
						style={[
							styles.card,
							{ backgroundColor: colors.surface, borderColor: colors.border },
						]}
					>
						<View style={[styles.avatar, { backgroundColor: colors.border }]}>
							<Text style={[styles.avatarText, { color: colors.muted }]}>
								访
							</Text>
						</View>
						<Text style={[styles.title, { color: colors.foreground }]}>
							登录后查看你的主页
						</Text>
						<Text style={[styles.body, { color: colors.muted }]}>
							发布作品、记录灵感，也可以为喜欢的内容点赞
						</Text>
						<Pressable
							onPress={() => router.push("/sign-in")}
							style={[styles.primaryButton, { backgroundColor: colors.accent }]}
						>
							<Text style={styles.primaryText}>去登录</Text>
						</Pressable>
					</View>
				}
				pendingFallback={
					<Text style={{ color: colors.muted }}>正在读取登录状态…</Text>
				}
			>
				<AuthenticatedProfile />
			</AuthGate>
		</SafeAreaView>
	);
}

function AuthenticatedProfile() {
	const router = useRouter();
	const { signOut, user } = useAuth();
	const { colors } = useTheme();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSigningOut, setIsSigningOut] = useState(false);

	if (!user) {
		return null;
	}

	const exit = async () => {
		setIsSigningOut(true);
		setErrorMessage(null);
		try {
			await signOut();
			router.replace("/");
		} catch {
			setErrorMessage("退出失败，请稍后再试");
		} finally {
			setIsSigningOut(false);
		}
	};

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: colors.surface, borderColor: colors.border },
			]}
		>
			<View style={[styles.avatar, { backgroundColor: colors.accent }]}>
				<Text style={styles.signedInAvatarText}>{user.name.slice(0, 1)}</Text>
			</View>
			<Text style={[styles.title, { color: colors.foreground }]}>
				{user.name}
			</Text>
			<Text style={[styles.body, { color: colors.muted }]}>{user.email}</Text>
			<Text style={[styles.placeholder, { color: colors.muted }]}>
				你发布的内容将在下一阶段展示
			</Text>
			{errorMessage ? (
				<Text style={styles.errorText}>{errorMessage}</Text>
			) : null}
			<Pressable
				disabled={isSigningOut}
				onPress={exit}
				style={[styles.secondaryButton, { borderColor: colors.border }]}
			>
				<Text style={[styles.secondaryText, { color: colors.foreground }]}>
					{isSigningOut ? "正在退出…" : "退出登录"}
				</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, paddingHorizontal: 20 },
	pageTitle: { fontSize: 30, fontWeight: "800", paddingVertical: 18 },
	card: {
		alignItems: "center",
		borderRadius: 24,
		borderWidth: 1,
		gap: 10,
		marginTop: 18,
		padding: 28,
	},
	avatar: {
		alignItems: "center",
		borderRadius: 36,
		height: 72,
		justifyContent: "center",
		marginBottom: 6,
		width: 72,
	},
	avatarText: { fontSize: 24, fontWeight: "700" },
	signedInAvatarText: { color: "#ffffff", fontSize: 26, fontWeight: "800" },
	title: { fontSize: 21, fontWeight: "700", textAlign: "center" },
	body: { fontSize: 15, lineHeight: 22, textAlign: "center" },
	placeholder: { fontSize: 14, marginTop: 16 },
	primaryButton: {
		alignItems: "center",
		alignSelf: "stretch",
		borderRadius: 14,
		marginTop: 14,
		paddingVertical: 14,
	},
	primaryText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
	secondaryButton: {
		alignItems: "center",
		alignSelf: "stretch",
		borderRadius: 14,
		borderWidth: 1,
		marginTop: 12,
		paddingVertical: 13,
	},
	secondaryText: { fontSize: 15, fontWeight: "600" },
	errorText: { color: "#c0392b", fontSize: 14 },
});
