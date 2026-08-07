import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { apiBaseUrl } from "@/lib/api";

export default function HomeScreen() {
	const queryClient = useQueryClient();
	const greetingQuery = useQuery(homeGreetingQueryOptions);

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
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	body: {
		color: "#202124",
		fontSize: 18,
		lineHeight: 26,
	},
	button: {
		alignItems: "center",
		backgroundColor: "#202124",
		borderRadius: 8,
		minHeight: 48,
		justifyContent: "center",
		paddingHorizontal: 18,
	},
	buttonPressed: {
		opacity: 0.68,
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
	},
	content: {
		gap: 22,
		padding: 20,
		paddingBottom: 36,
	},
	error: {
		color: "#c2362a",
		fontSize: 16,
		lineHeight: 24,
	},
	eyebrow: {
		color: "#f25555",
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
		color: "#737373",
		fontSize: 13,
		fontWeight: "700",
		letterSpacing: 0,
		textTransform: "uppercase",
	},
	panel: {
		backgroundColor: "#fff",
		borderColor: "#e8e4de",
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
		backgroundColor: "#fbfaf8",
		flex: 1,
	},
	subtitle: {
		color: "#5f6368",
		fontSize: 16,
		lineHeight: 24,
	},
	title: {
		color: "#202124",
		fontSize: 32,
		fontWeight: "800",
		letterSpacing: 0,
		lineHeight: 38,
	},
	url: {
		color: "#202124",
		fontSize: 15,
		lineHeight: 22,
	},
});
