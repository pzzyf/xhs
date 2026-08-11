import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/providers/theme-provider";

export default function MeScreen() {
	const { colors } = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<Text style={[styles.title, { color: colors.foreground }]}>我的</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		fontSize: 24,
		fontWeight: "600",
	},
});
