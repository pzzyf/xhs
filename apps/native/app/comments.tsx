import { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackHeader } from "@/components/back-header";
import { InputBar } from "@/features/input/input-bar";
import type { ThemeTokens } from "@/features/theme/tokens";
import { useTheme } from "@/providers/theme-provider";

type Comment = {
	author: string;
	id: number;
	text: string;
	time: string;
};

const initialComments: Comment[] = [
	{ author: "小红", id: 1, text: "太喜欢这个配色了！", time: "10:24" },
	{ author: "阿蓝", id: 2, text: "深色模式也好看 😍", time: "10:26" },
];

let nextCommentId = 3;

function formatTime(date: Date) {
	return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function CommentsScreen() {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [comments, setComments] = useState(initialComments);
	const [draft, setDraft] = useState("");

	function sendComment() {
		const text = draft.trim();

		if (text.length === 0) {
			return;
		}

		setComments((previous) => [
			...previous,
			{ author: "我", id: nextCommentId++, text, time: formatTime(new Date()) },
		]);
		setDraft("");
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<BackHeader title="评论" />
			<FlatList
				contentContainerStyle={styles.listContent}
				data={comments}
				keyboardShouldPersistTaps="handled"
				keyExtractor={(item) => String(item.id)}
				renderItem={({ item }) => (
					<View style={styles.comment}>
						<View style={styles.commentHeader}>
							<Text style={styles.author}>{item.author}</Text>
							<Text style={styles.time}>{item.time}</Text>
						</View>
						<Text style={styles.text}>{item.text}</Text>
					</View>
				)}
				style={styles.list}
			/>
			<InputBar
				onChangeText={setDraft}
				onSend={sendComment}
				placeholder="说点什么…"
				value={draft}
			/>
		</SafeAreaView>
	);
}

function createStyles(colors: ThemeTokens) {
	return StyleSheet.create({
		author: {
			color: colors.accent,
			fontSize: 14,
			fontWeight: "700",
		},
		comment: {
			backgroundColor: colors.surface,
			borderColor: colors.border,
			borderRadius: 10,
			borderWidth: StyleSheet.hairlineWidth,
			gap: 6,
			padding: 14,
		},
		commentHeader: {
			alignItems: "center",
			flexDirection: "row",
			justifyContent: "space-between",
		},
		list: {
			flex: 1,
		},
		listContent: {
			gap: 10,
			padding: 16,
		},
		safeArea: {
			backgroundColor: colors.background,
			flex: 1,
		},
		text: {
			color: colors.foreground,
			fontSize: 16,
			lineHeight: 23,
		},
		time: {
			color: colors.muted,
			fontSize: 12,
		},
	});
}
