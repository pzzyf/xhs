import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PortalHost } from "heroui-native/portal";
import { HeroUINativeProviderRaw } from "heroui-native/provider-raw";
import { ToastProvider } from "heroui-native/toast";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "../global.css";

import { AuthProvider } from "@/features/auth/auth-provider";
import { AppQueryProvider } from "@/providers/query-provider";
import { ThemeProvider, useTheme } from "@/providers/theme-provider";

function ThemedRoot() {
	const { resolvedScheme } = useTheme();

	return (
		<>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="(tabs)" />
				<Stack.Screen name="sign-in" />
			</Stack>
			<StatusBar style={resolvedScheme === "dark" ? "light" : "dark"} />
		</>
	);
}

export default function RootLayout() {
	return (
		<AppQueryProvider>
			<GestureHandlerRootView style={styles.container}>
				<SafeAreaProvider>
					<KeyboardProvider>
						<HeroUINativeProviderRaw>
							<ToastProvider>
								<AuthProvider>
									<ThemeProvider>
										<ThemedRoot />
									</ThemeProvider>
								</AuthProvider>
								<PortalHost />
							</ToastProvider>
						</HeroUINativeProviderRaw>
					</KeyboardProvider>
				</SafeAreaProvider>
			</GestureHandlerRootView>
		</AppQueryProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
