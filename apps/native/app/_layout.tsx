import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppQueryProvider } from "@/providers/query-provider";

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={styles.container}>
			<SafeAreaProvider>
				<AppQueryProvider>
					<Stack screenOptions={{ headerShown: false }} />
					<StatusBar style="dark" />
				</AppQueryProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
