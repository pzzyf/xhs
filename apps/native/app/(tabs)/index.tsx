import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
	ActivityIndicator,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	homeGreetingQueryKey,
	homeGreetingQueryOptions,
} from "@/features/home/queries";
import type { ThemeTokens } from "@/features/theme/tokens";
import { apiBaseUrl } from "@/lib/api";
import { useTheme } from "@/providers/theme-provider";

export default function HomeScreen() {
	const queryClient = useQueryClient();
	const greetingQuery = useQuery(homeGreetingQueryOptions);
	const { colors } = useTheme();
	const styles = createStyles(colors);

	const errorMessage =
		greetingQuery.error instanceof Error
			? greetingQuery.error.message
			: "请求失败，请稍后重试";

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={
					<RefreshControl
						onRefresh={() => {
							void greetingQuery.refetch();
						}}
						refreshing={greetingQuery.isRefetching}
					/>
				}
			>
				<View style={styles.header}>
					<Text style={styles.eyebrow}>XHS Native</Text>
					<Text style={styles.title}>小红书移动端</Text>
					<Text style={styles.subtitle}>服务地址：{apiBaseUrl}</Text>
				</View>

				<View style={styles.panel}>
					<View style={styles.panelHeader}>
						<View>
							<Text style={styles.label}>接口响应</Text>
							<Text style={styles.url}>{greetingQuery.status}</Text>
						</View>
						{greetingQuery.isFetching ? (
							<ActivityIndicator color="#f25555" />
						) : null}
					</View>

					{greetingQuery.isLoading ? (
						<Text style={styles.body}>正在加载...</Text>
					) : greetingQuery.isError ? (
						<Text style={styles.error}>{errorMessage}</Text>
					) : (
						<Text style={styles.body}>{greetingQuery.data}</Text>
					)}

					<Pressable
						accessibilityRole="button"
						disabled={greetingQuery.isFetching}
						onPress={() => {
							void queryClient.invalidateQueries({
								queryKey: homeGreetingQueryKey,
							});
						}}
						style={({ pressed }) => [
							styles.button,
							pressed || greetingQuery.isFetching ? styles.buttonPressed : null,
						]}
					>
						<Text style={styles.buttonText}>
							{greetingQuery.isFetching ? "刷新中" : "重新请求"}
						</Text>
					</Pressable>
				</View>

				<View style={styles.demoSection}>
					<Text style={styles.label}>输入功能演示</Text>
					<Pressable
						accessibilityRole="button"
						onPress={() => {
							router.push("/comments");
						}}
						style={styles.demoButton}
					>
						<Text style={styles.demoButtonText}>💬 评论</Text>
					</Pressable>
					<Pressable
						accessibilityRole="button"
						onPress={() => {
							router.push("/chat");
						}}
						style={styles.demoButton}
					>
						<Text style={styles.demoButtonText}>✉️ 聊天</Text>
					</Pressable>
					<Pressable
						accessibilityRole="button"
						onPress={() => {
							router.push("/publish");
						}}
						style={styles.demoButton}
					>
						<Text style={styles.demoButtonText}>✏️ 发布编辑器</Text>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

function createStyles(colors: ThemeTokens) {
	return StyleSheet.create({
		body: {
			color: colors.foreground,
			fontSize: 18,
			lineHeight: 26,
		},
		button: {
			alignItems: "center",
			backgroundColor: colors.foreground,
			borderRadius: 8,
			minHeight: 48,
			justifyContent: "center",
			paddingHorizontal: 18,
		},
		buttonPressed: {
			opacity: 0.68,
		},
		buttonText: {
			color: colors.background,
			fontSize: 16,
			fontWeight: "700",
		},
		content: {
			gap: 22,
			padding: 20,
			paddingBottom: 36,
		},
		demoButton: {
			alignItems: "center",
			backgroundColor: colors.surface,
			borderColor: colors.border,
			borderRadius: 10,
			borderWidth: StyleSheet.hairlineWidth,
			minHeight: 48,
			justifyContent: "center",
			paddingHorizontal: 16,
		},
		demoButtonText: {
			color: colors.foreground,
			fontSize: 16,
			fontWeight: "600",
		},
		demoSection: {
			gap: 10,
		},
		error: {
			color: colors.danger,
			fontSize: 16,
			lineHeight: 24,
		},
		eyebrow: {
			color: colors.accent,
			fontSize: 13,
			fontWeight: "700",
			letterSpacing: 0,
			textTransform: "uppercase",
		},
		header: {
			gap: 10,
			paddingTop: 18,
		},
		label: {
			color: colors.muted,
			fontSize: 13,
			fontWeight: "700",
			letterSpacing: 0,
			textTransform: "uppercase",
		},
		panel: {
			backgroundColor: colors.surface,
			borderColor: colors.border,
			borderRadius: 8,
			borderWidth: StyleSheet.hairlineWidth,
			boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
			gap: 18,
			padding: 18,
		},
		panelHeader: {
			alignItems: "center",
			flexDirection: "row",
			gap: 12,
			justifyContent: "space-between",
		},
		safeArea: {
			backgroundColor: colors.background,
			flex: 1,
		},
		subtitle: {
			color: colors.muted,
			fontSize: 16,
			lineHeight: 24,
		},
		title: {
			color: colors.foreground,
			fontSize: 32,
			fontWeight: "800",
			letterSpacing: 0,
			lineHeight: 38,
		},
		url: {
			color: colors.foreground,
			fontSize: 15,
			lineHeight: 22,
		},
	});
}
