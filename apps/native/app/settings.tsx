import { useRouter } from "expo-router";
import { useToast } from "heroui-native/toast";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/avatar";
import { useAuth } from "@/features/auth/auth-provider";
import { useTheme } from "@/providers/theme-provider";

export default function SettingsScreen() {
	const router = useRouter();
	const { colors } = useTheme();
	const { isPending, user, signOut } = useAuth();
	const { toast } = useToast();
	const [isSigningOut, setIsSigningOut] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	useEffect(() => {
		if (!isPending && !user) {
			router.replace("/");
		}
	}, [isPending, router, user]);

	if (isPending || !user) {
		return null;
	}

	const exit = async () => {
		setIsSigningOut(true);
		setErrorMessage(null);
		try {
			await signOut();
			toast.show({
				label: "已退出登录",
				variant: "success",
				duration: 2200,
			});
			router.replace("/");
		} catch {
			setErrorMessage("退出失败，请稍后再试");
			toast.show({
				label: "退出失败，请稍后再试",
				variant: "danger",
				duration: 2600,
			});
		} finally {
			setIsSigningOut(false);
		}
	};

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: colors.background }]}
		>
			<View style={styles.header}>
				<Pressable onPress={() => router.back()} hitSlop={12}>
					<Text style={[styles.back, { color: colors.muted }]}>返回</Text>
				</Pressable>
				<Text style={[styles.headerTitle, { color: colors.foreground }]}>
					设置
				</Text>
				<View style={styles.spacer} />
			</View>

			<View
				style={[
					styles.profileCard,
					{ backgroundColor: colors.surface, borderColor: colors.border },
				]}
			>
				<Avatar name={user.name} size={56} />
				<View style={styles.profileCopy}>
					<Text style={[styles.name, { color: colors.foreground }]}>
						{user.name}
					</Text>
					<Text style={[styles.email, { color: colors.muted }]}>
						{user.email}
					</Text>
				</View>
			</View>

			{errorMessage ? (
				<Text style={[styles.error, { color: "#e5484d" }]}>{errorMessage}</Text>
			) : null}

			<Pressable
				disabled={isSigningOut}
				onPress={() => void exit()}
				style={({ pressed }) => [
					styles.logoutButton,
					{ borderColor: colors.border },
					pressed && styles.pressed,
				]}
			>
				<Text
					style={[
						styles.logoutText,
						{ color: isSigningOut ? colors.muted : "#e5484d" },
					]}
				>
					{isSigningOut ? "正在退出…" : "退出登录"}
				</Text>
			</Pressable>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, paddingHorizontal: 20 },
	header: {
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 14,
	},
	back: { fontSize: 15, fontWeight: "600" },
	headerTitle: { fontSize: 18, fontWeight: "800" },
	spacer: { width: 40 },
	profileCard: {
		alignItems: "center",
		borderRadius: 20,
		borderWidth: 1,
		flexDirection: "row",
		gap: 14,
		marginTop: 10,
		padding: 18,
	},
	profileCopy: { flex: 1, gap: 4 },
	name: { fontSize: 18, fontWeight: "800" },
	email: { fontSize: 14, lineHeight: 20 },
	error: { fontSize: 14, fontWeight: "600", marginTop: 14 },
	logoutButton: {
		alignItems: "center",
		borderRadius: 14,
		borderWidth: 1,
		marginTop: 18,
		paddingVertical: 13,
	},
	logoutText: { fontSize: 15, fontWeight: "700" },
	pressed: { opacity: 0.72 },
});
