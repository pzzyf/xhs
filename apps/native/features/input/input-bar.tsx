import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";

import type { ThemeTokens } from "@/features/theme/tokens";
import { useTheme } from "@/providers/theme-provider";

import { EmojiPicker } from "./emoji-picker";

type InputBarProps = {
	onChangeText: (text: string) => void;
	onSend: () => void;
	placeholder?: string;
	sendLabel?: string;
	value: string;
};

export function InputBar({
	onChangeText,
	onSend,
	placeholder,
	sendLabel = "发送",
	value,
}: InputBarProps) {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [emojiVisible, setEmojiVisible] = useState(false);
	const canSend = value.trim().length > 0;

	return (
		<KeyboardStickyView style={styles.container}>
			{emojiVisible ? (
				<EmojiPicker
					onSelect={(emoji) => {
						onChangeText(`${value}${emoji}`);
					}}
				/>
			) : null}
			<View style={styles.bar}>
				<Pressable
					accessibilityRole="button"
					accessibilityState={{ selected: emojiVisible }}
					onPress={() => {
						setEmojiVisible((visible) => !visible);
					}}
					style={styles.emojiButton}
				>
					<Text style={styles.emojiIcon}>{emojiVisible ? "⌨️" : "😀"}</Text>
				</Pressable>
				<TextInput
					multiline
					onChangeText={onChangeText}
					placeholder={placeholder}
					placeholderTextColor={colors.muted}
					style={styles.input}
					value={value}
				/>
				<Pressable
					accessibilityRole="button"
					disabled={!canSend}
					onPress={onSend}
					style={[
						styles.sendButton,
						!canSend ? styles.sendButtonDisabled : null,
					]}
				>
					<Text style={styles.sendButtonText}>{sendLabel}</Text>
				</Pressable>
			</View>
		</KeyboardStickyView>
	);
}

function createStyles(colors: ThemeTokens) {
	return StyleSheet.create({
		bar: {
			alignItems: "flex-end",
			backgroundColor: colors.surface,
			borderTopColor: colors.border,
			borderTopWidth: StyleSheet.hairlineWidth,
			flexDirection: "row",
			gap: 8,
			padding: 10,
		},
		container: {
			width: "100%",
		},
		emojiButton: {
			alignItems: "center",
			height: 40,
			justifyContent: "center",
			width: 40,
		},
		emojiIcon: {
			fontSize: 22,
		},
		input: {
			backgroundColor: colors.background,
			borderColor: colors.border,
			borderRadius: 18,
			borderWidth: StyleSheet.hairlineWidth,
			color: colors.foreground,
			flex: 1,
			fontSize: 16,
			maxHeight: 96,
			minHeight: 40,
			paddingHorizontal: 14,
			paddingVertical: 9,
		},
		sendButton: {
			alignItems: "center",
			backgroundColor: colors.accent,
			borderRadius: 18,
			height: 40,
			justifyContent: "center",
			paddingHorizontal: 16,
		},
		sendButtonDisabled: {
			opacity: 0.4,
		},
		sendButtonText: {
			color: colors.accentForeground,
			fontSize: 15,
			fontWeight: "700",
		},
	});
}
