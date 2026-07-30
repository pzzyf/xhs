import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PortalHost } from "heroui-native/portal";
import { HeroUINativeProviderRaw } from "heroui-native/provider-raw";
import { ToastProvider } from "heroui-native/toast";
import { StyleSheet, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "../global.css";

import { AnonymousSessionProvider } from "@/providers/anonymous-session-provider";
import { PushBridgeProvider } from "@/providers/push-bridge-provider";
import { AppQueryProvider } from "@/providers/query-provider";

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const navigationTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

	return (
		<AppQueryProvider>
			<GestureHandlerRootView style={styles.container}>
				<SafeAreaProvider>
					<KeyboardProvider>
						<HeroUINativeProviderRaw>
							<ToastProvider>
								<AnonymousSessionProvider>
									<PushBridgeProvider>
										<ThemeProvider value={navigationTheme}>
											<Stack screenOptions={{ headerShown: false }}>
												<Stack.Screen name="(tabs)" />
											</Stack>
											<StatusBar style="auto" />
										</ThemeProvider>
									</PushBridgeProvider>
								</AnonymousSessionProvider>
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
