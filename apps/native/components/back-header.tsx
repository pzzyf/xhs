import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ThemeTokens } from "@/features/theme/tokens";
import { useTheme } from "@/providers/theme-provider";

type BackHeaderProps = {
	onBack?: () => void;
	showBack?: boolean;
	title: string;
};

export function BackHeader({
	onBack,
	showBack = true,
	title,
}: BackHeaderProps) {
	const { colors } = useTheme();
	const styles = createStyles(colors);

	return (
		<View style={styles.header}>
			{showBack ? (
				<Pressable
					accessibilityRole="button"
					hitSlop={8}
					onPress={() => {
						if (onBack) {
							onBack();
						} else {
							router.back();
						}
					}}
					style={styles.backButton}
				>
					<Text style={styles.backText}>‹ 返回</Text>
				</Pressable>
			) : (
				<View style={styles.spacer} />
			)}
			<Text numberOfLines={1} style={styles.title}>
				{title}
			</Text>
			<View style={styles.spacer} />
		</View>
	);
}

function createStyles(colors: ThemeTokens) {
	return StyleSheet.create({
		backButton: {
			minWidth: 64,
		},
		backText: {
			color: colors.accent,
			fontSize: 16,
			fontWeight: "600",
		},
		header: {
			alignItems: "center",
			backgroundColor: colors.surface,
			borderBottomColor: colors.border,
			borderBottomWidth: StyleSheet.hairlineWidth,
			flexDirection: "row",
			minHeight: 52,
			paddingHorizontal: 12,
		},
		spacer: {
			minWidth: 64,
		},
		title: {
			color: colors.foreground,
			flex: 1,
			fontSize: 17,
			fontWeight: "700",
			textAlign: "center",
		},
	});
}
