import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/avatar";
import { NoteCard } from "@/components/note-card";
import { PageHeader } from "@/components/page-header";
import { AuthGate } from "@/features/auth/auth-gate";
import { useAuth } from "@/features/auth/auth-provider";
import { useMyNotes } from "@/features/me/queries";
import { useTheme } from "@/providers/theme-provider";

export default function MeScreen() {
	const router = useRouter();
	const { colors } = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: colors.background }]}
		>
			<PageHeader
				title="我的"
				action={
					<Pressable onPress={() => router.push("/settings")} hitSlop={10}>
						<Text style={[styles.settingsLink, { color: colors.accent }]}>
							设置
						</Text>
					</Pressable>
				}
			/>
			<AuthGate
				fallback={
					<View
						style={[
							styles.card,
							{ backgroundColor: colors.surface, borderColor: colors.border },
						]}
					>
						<Avatar name="访客" size={72} />
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
	const { user } = useAuth();
	const { colors } = useTheme();
	const query = useMyNotes();
	const notes = query.data ?? [];

	if (!user) {
		return null;
	}

	return (
		<View style={styles.profile}>
			<View style={styles.profileHeader}>
				<Avatar name={user.name} size={72} />
				<View style={styles.profileCopy}>
					<Text style={[styles.name, { color: colors.foreground }]}>
						{user.name}
					</Text>
					<Text style={[styles.email, { color: colors.muted }]}>
						{user.email}
					</Text>
				</View>
			</View>

			<Text style={[styles.sectionTitle, { color: colors.foreground }]}>
				我的笔记
			</Text>
			{query.isPending ? (
				<Text style={[styles.empty, { color: colors.muted }]}>正在加载…</Text>
			) : query.isError ? (
				<Pressable onPress={() => void query.refetch()}>
					<Text style={[styles.empty, { color: colors.accent }]}>
						加载失败，点击重试
					</Text>
				</Pressable>
			) : notes.length === 0 ? (
				<Text style={[styles.empty, { color: colors.muted }]}>
					还没有发布过笔记
				</Text>
			) : (
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
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, paddingHorizontal: 20 },
	settingsLink: { fontSize: 15, fontWeight: "700" },
	card: {
		alignItems: "center",
		borderRadius: 24,
		borderWidth: 1,
		gap: 10,
		marginTop: 18,
		padding: 28,
	},
	title: { fontSize: 21, fontWeight: "700", textAlign: "center" },
	body: { fontSize: 15, lineHeight: 22, textAlign: "center" },
	primaryButton: {
		alignItems: "center",
		alignSelf: "stretch",
		borderRadius: 14,
		marginTop: 14,
		paddingVertical: 14,
	},
	primaryText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
	profile: { gap: 16 },
	profileHeader: {
		alignItems: "center",
		flexDirection: "row",
		gap: 14,
	},
	profileCopy: { flex: 1, gap: 4 },
	name: { fontSize: 22, fontWeight: "800" },
	email: { fontSize: 14, lineHeight: 20 },
	sectionTitle: { fontSize: 18, fontWeight: "800", marginTop: 8 },
	row: { gap: 12 },
	column: { flex: 1 },
	listContent: { gap: 12, paddingBottom: 28 },
	empty: { fontSize: 15, lineHeight: 22, paddingVertical: 24 },
});
