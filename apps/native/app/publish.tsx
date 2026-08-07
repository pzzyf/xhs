import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
	KeyboardAvoidingView,
	KeyboardStickyView,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackHeader } from "@/components/back-header";
import { EmojiPicker } from "@/features/input/emoji-picker";
import type { ThemeTokens } from "@/features/theme/tokens";
import { useTheme } from "@/providers/theme-provider";

export default function PublishScreen() {
	const { colors } = useTheme();
	const styles = createStyles(colors);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [emojiVisible, setEmojiVisible] = useState(false);
	const [published, setPublished] = useState(false);

	const canPublish = title.trim().length > 0 && content.trim().length > 0;

	function publish() {
		if (!canPublish) {
			return;
		}

		setPublished(true);
	}

	function reset() {
		setTitle("");
		setContent("");
		setEmojiVisible(false);
		setPublished(false);
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<KeyboardAvoidingView behavior="padding" style={styles.flex}>
				<BackHeader title="发布" />
				{published ? (
					<View style={styles.publishedPanel}>
						<Text style={styles.publishedEmoji}>🎉</Text>
						<Text style={styles.publishedTitle}>已发布</Text>
						<Text style={styles.publishedBody}>
							这是本地演示，发布按钮不会真正上传内容。
						</Text>
						<Pressable
							accessibilityRole="button"
							onPress={reset}
							style={styles.primaryButton}
						>
							<Text style={styles.primaryButtonText}>再写一篇</Text>
						</Pressable>
					</View>
				) : (
					<View style={styles.flex}>
						<View style={styles.form}>
							<TextInput
								onChangeText={setTitle}
								placeholder="标题"
								placeholderTextColor={colors.muted}
								style={styles.titleInput}
								value={title}
							/>
							<TextInput
								multiline
								onChangeText={setContent}
								placeholder="分享新鲜事…"
								placeholderTextColor={colors.muted}
								style={styles.contentInput}
								textAlignVertical="top"
								value={content}
							/>
						</View>
						<KeyboardStickyView style={styles.bottomBar}>
							{emojiVisible ? (
								<EmojiPicker
									onSelect={(emoji) => {
										setContent((previous) => `${previous}${emoji}`);
									}}
								/>
							) : null}
							<View style={styles.bottomRow}>
								<Pressable
									accessibilityRole="button"
									accessibilityState={{ selected: emojiVisible }}
									onPress={() => {
										setEmojiVisible((visible) => !visible);
									}}
									style={styles.emojiButton}
								>
									<Text style={styles.emojiIcon}>
										{emojiVisible ? "⌨️" : "😀"}
									</Text>
								</Pressable>
								<Pressable
									accessibilityRole="button"
									disabled={!canPublish}
									onPress={publish}
									style={[
										styles.publishButton,
										!canPublish ? styles.publishButtonDisabled : null,
									]}
								>
									<Text style={styles.publishButtonText}>发布</Text>
								</Pressable>
							</View>
						</KeyboardStickyView>
					</View>
				)}
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

function createStyles(colors: ThemeTokens) {
	return StyleSheet.create({
		bottomBar: {
			width: "100%",
		},
		bottomRow: {
			alignItems: "center",
			backgroundColor: colors.surface,
			borderTopColor: colors.border,
			borderTopWidth: StyleSheet.hairlineWidth,
			flexDirection: "row",
			justifyContent: "space-between",
			padding: 10,
		},
		contentInput: {
			color: colors.foreground,
			flex: 1,
			fontSize: 17,
			lineHeight: 25,
			minHeight: 160,
			padding: 0,
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
		flex: {
			flex: 1,
		},
		form: {
			flex: 1,
			gap: 18,
			padding: 20,
		},
		primaryButton: {
			alignItems: "center",
			backgroundColor: colors.accent,
			borderRadius: 24,
			marginTop: 18,
			minHeight: 48,
			justifyContent: "center",
			paddingHorizontal: 24,
		},
		primaryButtonText: {
			color: colors.accentForeground,
			fontSize: 16,
			fontWeight: "700",
		},
		publishButton: {
			alignItems: "center",
			backgroundColor: colors.accent,
			borderRadius: 20,
			height: 40,
			justifyContent: "center",
			paddingHorizontal: 22,
		},
		publishButtonDisabled: {
			opacity: 0.4,
		},
		publishButtonText: {
			color: colors.accentForeground,
			fontSize: 15,
			fontWeight: "700",
		},
		publishedBody: {
			color: colors.muted,
			fontSize: 15,
			lineHeight: 22,
			textAlign: "center",
		},
		publishedEmoji: {
			fontSize: 44,
			textAlign: "center",
		},
		publishedPanel: {
			alignItems: "center",
			flex: 1,
			gap: 10,
			justifyContent: "center",
			padding: 24,
		},
		publishedTitle: {
			color: colors.foreground,
			fontSize: 22,
			fontWeight: "800",
		},
		safeArea: {
			backgroundColor: colors.background,
			flex: 1,
		},
		titleInput: {
			borderBottomColor: colors.border,
			borderBottomWidth: StyleSheet.hairlineWidth,
			color: colors.foreground,
			fontSize: 22,
			fontWeight: "700",
			paddingBottom: 10,
		},
	});
}
