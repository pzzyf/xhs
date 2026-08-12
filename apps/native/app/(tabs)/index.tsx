import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/auth-provider";
import { useTheme } from "@/providers/theme-provider";

export default function HomeScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const { colors } = useTheme();
	const [notice, setNotice] = useState<string | null>(null);

	const openPublish = () => {
		if (!user) {
			router.push("/sign-in");
			return;
		}
		setNotice("发布功能将在下一阶段开放");
	};

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: colors.background }]}
		>
			<View style={styles.header}>
				<View>
					<Text style={[styles.eyebrow, { color: colors.accent }]}>
						发现灵感
					</Text>
					<Text style={[styles.title, { color: colors.foreground }]}>首页</Text>
				</View>
				<Pressable
					onPress={openPublish}
					style={({ pressed }) => [
						styles.publishButton,
						{ backgroundColor: colors.accent },
						pressed && styles.pressed,
					]}
				>
					<Text style={styles.publishText}>发布</Text>
				</Pressable>
			</View>

			<View
				style={[
					styles.emptyCard,
					{ backgroundColor: colors.surface, borderColor: colors.border },
				]}
			>
				<Text style={[styles.emptyTitle, { color: colors.foreground }]}>
					内容正在路上
				</Text>
				<Text style={[styles.emptyBody, { color: colors.muted }]}>
					下一阶段将接入真实双列信息流
				</Text>
				{notice ? (
					<Text style={[styles.notice, { color: colors.accent }]}>
						{notice}
					</Text>
				) : null}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, paddingHorizontal: 20 },
	header: {
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 18,
	},
	eyebrow: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
	title: { fontSize: 30, fontWeight: "800" },
	publishButton: {
		borderRadius: 999,
		paddingHorizontal: 20,
		paddingVertical: 11,
	},
	publishText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
	pressed: { opacity: 0.72 },
	emptyCard: {
		alignItems: "center",
		borderRadius: 24,
		borderWidth: 1,
		gap: 8,
		justifyContent: "center",
		marginTop: 24,
		minHeight: 260,
		padding: 28,
	},
	emptyTitle: { fontSize: 20, fontWeight: "700" },
	emptyBody: { fontSize: 15, lineHeight: 22, textAlign: "center" },
	notice: { fontSize: 14, fontWeight: "600", marginTop: 8 },
});
