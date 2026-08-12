import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/auth-provider";
import { NoteCard } from "@/features/notes/note-card";
import { flattenNotePages, useNotesList } from "@/features/notes/queries";
import { useTheme } from "@/providers/theme-provider";

export default function HomeScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const { colors } = useTheme();
	const [notice, setNotice] = useState<string | null>(null);
	const query = useNotesList();
	const notes = flattenNotePages(query.data?.pages);

	const openPublish = () => {
		if (!user) {
			router.push("/sign-in");
			return;
		}
		setNotice("发布功能将在下一阶段开放");
	};

	const loadNextPage = () => {
		if (query.hasNextPage && !query.isFetchingNextPage) {
			void query.fetchNextPage();
		}
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

			{notice ? (
				<Text style={[styles.notice, { color: colors.accent }]}>{notice}</Text>
			) : null}

			<FlatList
				data={notes}
				keyExtractor={(note) => note.id}
				numColumns={2}
				columnWrapperStyle={styles.row}
				contentContainerStyle={styles.listContent}
				renderItem={({ item }) => (
					<View style={styles.column}>
						<NoteCard
							note={item}
							onPress={(id) => router.push(`/note/${id}`)}
						/>
					</View>
				)}
				onEndReached={loadNextPage}
				onEndReachedThreshold={0.35}
				ListEmptyComponent={
					query.isPending ? (
						<FeedMessage title="正在加载内容" body="马上就好" />
					) : query.isError ? (
						<FeedMessage
							title="内容加载失败"
							body="请检查网络后重试"
							actionLabel="重新加载"
							onAction={() => void query.refetch()}
						/>
					) : (
						<FeedMessage title="还没有内容" body="稍后再来看看吧" />
					)
				}
				ListFooterComponent={
					query.isFetchingNextPage ? (
						<Text style={[styles.footer, { color: colors.muted }]}>
							正在加载更多
						</Text>
					) : query.isFetchNextPageError ? (
						<Pressable onPress={() => void query.fetchNextPage()}>
							<Text style={[styles.footer, { color: colors.accent }]}>
								加载失败，点击重试
							</Text>
						</Pressable>
					) : notes.length > 0 && !query.hasNextPage ? (
						<Text style={[styles.footer, { color: colors.muted }]}>
							已经到底了
						</Text>
					) : null
				}
			/>
		</SafeAreaView>
	);
}

function FeedMessage({
	title,
	body,
	actionLabel,
	onAction,
}: {
	title: string;
	body: string;
	actionLabel?: string;
	onAction?: () => void;
}) {
	const { colors } = useTheme();

	return (
		<View
			style={[
				styles.emptyCard,
				{ backgroundColor: colors.surface, borderColor: colors.border },
			]}
		>
			<Text style={[styles.emptyTitle, { color: colors.foreground }]}>
				{title}
			</Text>
			<Text style={[styles.emptyBody, { color: colors.muted }]}>{body}</Text>
			{actionLabel && onAction ? (
				<Pressable onPress={onAction}>
					<Text style={[styles.notice, { color: colors.accent }]}>
						{actionLabel}
					</Text>
				</Pressable>
			) : null}
		</View>
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
	row: { gap: 12 },
	column: { flex: 1 },
	listContent: { gap: 12, paddingBottom: 28 },
	footer: {
		fontSize: 13,
		paddingVertical: 20,
		textAlign: "center",
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
