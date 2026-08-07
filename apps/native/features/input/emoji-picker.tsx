import { FlatList, Pressable, StyleSheet, Text } from "react-native";

import type { ThemeTokens } from "@/features/theme/tokens";
import { useTheme } from "@/providers/theme-provider";

import { EMOJIS } from "./emojis";

type EmojiPickerProps = {
	onSelect: (emoji: string) => void;
};

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
	const { colors } = useTheme();
	const styles = createStyles(colors);

	return (
		<FlatList
			contentContainerStyle={styles.grid}
			data={EMOJIS}
			keyboardShouldPersistTaps="handled"
			keyExtractor={(emoji) => emoji}
			numColumns={8}
			renderItem={({ item }) => (
				<Pressable
					accessibilityRole="button"
					onPress={() => {
						onSelect(item);
					}}
					style={styles.cell}
				>
					<Text style={styles.emoji}>{item}</Text>
				</Pressable>
			)}
			style={styles.list}
		/>
	);
}

function createStyles(colors: ThemeTokens) {
	return StyleSheet.create({
		cell: {
			alignItems: "center",
			height: 42,
			justifyContent: "center",
			width: "12.5%",
		},
		emoji: {
			fontSize: 24,
		},
		grid: {
			paddingBottom: 8,
			paddingHorizontal: 8,
		},
		list: {
			backgroundColor: colors.surface,
			borderTopColor: colors.border,
			borderTopWidth: StyleSheet.hairlineWidth,
			height: 208,
		},
	});
}
