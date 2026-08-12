import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { NoteDetail } from "@xhs/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useToast } from "heroui-native/toast";
import {
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useAuth } from "@/features/auth/auth-provider";
import { normalizeNoteId } from "@/features/notes/note-route";
import { useNote } from "@/features/notes/queries";
import { notesKeys } from "@/features/notes/query-options";
import { orpc } from "@/lib/orpc";
import { useTheme } from "@/providers/theme-provider";

export default function NoteDetailScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ id?: string | string[] }>();
	const id = normalizeNoteId(params.id);
	const query = useNote(id);
	const { colors } = useTheme();
	const { user } = useAuth();
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const detailKey = notesKeys.detail(id ?? "invalid");

	const likeMutation = useMutation({
		mutationFn: () => orpc.likes.toggle({ noteId: id ?? "invalid" }),
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: detailKey });
			const previous = queryClient.getQueryData<NoteDetail>(detailKey);
			queryClient.setQueryData<NoteDetail>(detailKey, (current) =>
				current
					? {
							...current,
							viewerHasLiked: !current.viewerHasLiked,
							likeCount: current.likeCount + (current.viewerHasLiked ? -1 : 1),
						}
					: current,
			);
			return { previous };
		},
		onError: (_error, _variables, context) => {
			if (context?.previous) {
				queryClient.setQueryData(detailKey, context.previous);
			}
			toast.show({
				label: "操作失败，请稍后重试",
				variant: "danger",
				duration: 2600,
			});
		},
		onSuccess: (output) => {
			queryClient.setQueryData<NoteDetail>(detailKey, (current) =>
				current
					? {
							...current,
							viewerHasLiked: output.liked,
							likeCount: output.likeCount,
						}
					: current,
			);
		},
	});

	const toggleLike = () => {
		if (!user) {
			router.push("/sign-in");
			return;
		}
		likeMutation.mutate();
	};

	if (!id) {
		return <DetailMessage title="笔记地址无效" body="请返回首页重新选择内容" />;
	}

	if (query.isPending) {
		return (
			<View style={[styles.message, { backgroundColor: colors.background }]}>
				<Text style={[styles.messageBody, { color: colors.muted }]}>
					正在加载笔记
				</Text>
			</View>
		);
	}

	if (query.isError || !query.data) {
		return (
			<DetailMessage
				title="笔记加载失败"
				body="内容可能不存在或网络暂时不可用"
				actionLabel="重新加载"
				onAction={() => void query.refetch()}
			/>
		);
	}

	const note = query.data;

	return (
		<ScrollView
			style={{ backgroundColor: colors.background }}
			contentContainerStyle={styles.scrollContent}
		>
			<Image
				source={{ uri: note.imageUrl }}
				style={styles.hero}
				resizeMode="cover"
			/>
			<View style={styles.content}>
				<Text style={[styles.title, { color: colors.foreground }]}>
					{note.title}
				</Text>
				<Text style={[styles.author, { color: colors.muted }]}>
					{note.authorName}
				</Text>
				<Text style={[styles.body, { color: colors.foreground }]}>
					{note.body}
				</Text>
				<View style={styles.tags}>
					{note.tags.map((tag) => (
						<View
							key={tag}
							style={[styles.tag, { backgroundColor: colors.surface }]}
						>
							<Text style={[styles.tagText, { color: colors.muted }]}>
								#{tag}
							</Text>
						</View>
					))}
				</View>
				<Pressable
					onPress={toggleLike}
					disabled={likeMutation.isPending}
					style={[styles.likeSummary, { borderColor: colors.border }]}
				>
					<Text
						style={[
							styles.likeText,
							{
								color: note.viewerHasLiked ? colors.accent : colors.foreground,
							},
						]}
					>
						{note.viewerHasLiked ? "已赞" : "点赞"} · {note.likeCount}
					</Text>
					<Text style={[styles.readonly, { color: colors.muted }]}>
						{likeMutation.isPending
							? "处理中"
							: user
								? note.viewerHasLiked
									? "点击取消"
									: "点击点赞"
								: "登录后点赞"}
					</Text>
				</Pressable>
			</View>
		</ScrollView>
	);
}

function DetailMessage({
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
		<View style={[styles.message, { backgroundColor: colors.background }]}>
			<Text style={[styles.messageTitle, { color: colors.foreground }]}>
				{title}
			</Text>
			<Text style={[styles.messageBody, { color: colors.muted }]}>{body}</Text>
			{actionLabel && onAction ? (
				<Pressable onPress={onAction}>
					<Text style={[styles.messageAction, { color: colors.accent }]}>
						{actionLabel}
					</Text>
				</Pressable>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	scrollContent: {
		// Android 系统导航条/手势区会遮挡底部内容，留足安全区
		paddingBottom: 96,
	},
	hero: {
		aspectRatio: 3 / 4,
		width: "100%",
	},
	content: {
		gap: 14,
		padding: 20,
	},
	title: {
		fontSize: 26,
		fontWeight: "800",
		lineHeight: 34,
	},
	author: {
		fontSize: 14,
		lineHeight: 20,
	},
	body: {
		fontSize: 16,
		lineHeight: 27,
	},
	tags: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	tag: {
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	tagText: {
		fontSize: 13,
		fontWeight: "600",
	},
	likeSummary: {
		alignItems: "center",
		borderRadius: 16,
		borderWidth: 1,
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: 6,
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	likeText: {
		fontSize: 15,
		fontWeight: "700",
	},
	readonly: {
		fontSize: 13,
	},
	message: {
		alignItems: "center",
		flex: 1,
		gap: 8,
		justifyContent: "center",
		padding: 28,
	},
	messageTitle: {
		fontSize: 20,
		fontWeight: "700",
	},
	messageBody: {
		fontSize: 15,
		lineHeight: 22,
		textAlign: "center",
	},
	messageAction: {
		fontSize: 15,
		fontWeight: "700",
		marginTop: 8,
	},
});
