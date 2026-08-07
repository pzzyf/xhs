import { useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackHeader } from "@/components/back-header";
import { InputBar } from "@/features/input/input-bar";
import type { ThemeTokens } from "@/features/theme/tokens";
import { useTheme } from "@/providers/theme-provider";

type Message = {
	id: number;
	mine: boolean;
	text: string;
	time: string;
};

const initialMessages: Message[] = [
	{ id: 1, mine: false, text: "你好呀 👋 这是聊天演示", time: "10:30" },
];

let nextMessageId = 2;

function formatTime(date: Date) {
	return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function ChatScreen() {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [messages, setMessages] = useState(initialMessages);
	const [draft, setDraft] = useState("");
	const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (replyTimer.current !== null) {
				clearTimeout(replyTimer.current);
			}
		};
	}, []);

	function sendMessage() {
		const text = draft.trim();

		if (text.length === 0) {
			return;
		}

		setMessages((previous) => [
			...previous,
			{ id: nextMessageId++, mine: true, text, time: formatTime(new Date()) },
		]);
		setDraft("");

		replyTimer.current = setTimeout(() => {
			setMessages((previous) => [
				...previous,
				{
					id: nextMessageId++,
					mine: false,
					text: "收到！",
					time: formatTime(new Date()),
				},
			]);
		}, 600);
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<BackHeader title="聊天" />
			<FlatList
				contentContainerStyle={styles.listContent}
				data={messages}
				keyboardShouldPersistTaps="handled"
				keyExtractor={(item) => String(item.id)}
				renderItem={({ item }) => (
					<View
						style={[
							styles.bubble,
							item.mine ? styles.bubbleMine : styles.bubbleOther,
						]}
					>
						<Text
							style={[
								styles.bubbleText,
								item.mine ? styles.bubbleTextMine : null,
							]}
						>
							{item.text}
						</Text>
						<Text style={[styles.time, item.mine ? styles.timeMine : null]}>
							{item.time}
						</Text>
					</View>
				)}
				style={styles.list}
			/>
			<InputBar
				onChangeText={setDraft}
				onSend={sendMessage}
				placeholder="发消息…"
				value={draft}
			/>
		</SafeAreaView>
	);
}

function createStyles(colors: ThemeTokens) {
	return StyleSheet.create({
		bubble: {
			borderRadius: 16,
			maxWidth: "78%",
			paddingHorizontal: 14,
			paddingVertical: 10,
		},
		bubbleMine: {
			alignSelf: "flex-end",
			backgroundColor: colors.accent,
			borderBottomRightRadius: 4,
		},
		bubbleOther: {
			alignSelf: "flex-start",
			backgroundColor: colors.surface,
			borderBottomLeftRadius: 4,
			borderColor: colors.border,
			borderWidth: StyleSheet.hairlineWidth,
		},
		bubbleText: {
			color: colors.foreground,
			fontSize: 16,
			lineHeight: 22,
		},
		bubbleTextMine: {
			color: colors.accentForeground,
		},
		list: {
			flex: 1,
		},
		listContent: {
			flexGrow: 1,
			gap: 8,
			padding: 16,
		},
		safeArea: {
			backgroundColor: colors.background,
			flex: 1,
		},
		time: {
			color: colors.muted,
			fontSize: 11,
			marginTop: 4,
		},
		timeMine: {
			color: colors.accentForeground,
			opacity: 0.75,
		},
	});
}
