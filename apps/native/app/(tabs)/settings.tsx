import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.content}>
				<Text style={styles.eyebrow}>XHS Native</Text>
				<Text style={styles.title}>设置</Text>
				<Text style={styles.body}>
					这里是第二个 Tab，可继续添加账户、主题和通知等设置。
				</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	body: {
		color: "#5f6368",
		fontSize: 16,
		lineHeight: 24,
	},
	content: {
		gap: 12,
		padding: 20,
		paddingTop: 38,
	},
	eyebrow: {
		color: "#f25555",
		fontSize: 13,
		fontWeight: "700",
		textTransform: "uppercase",
	},
	safeArea: {
		backgroundColor: "#fbfaf8",
		flex: 1,
	},
	title: {
		color: "#202124",
		fontSize: 32,
		fontWeight: "800",
		lineHeight: 38,
	},
});
