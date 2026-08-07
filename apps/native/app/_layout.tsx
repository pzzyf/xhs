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

import { AuthGate } from "@/features/auth/auth-gate";
import { GuestSessionProvider } from "@/features/auth/guest-session-provider";
import { AnonymousSessionProvider } from "@/providers/anonymous-session-provider";
import { PushBridgeProvider } from "@/providers/push-bridge-provider";
import { AppQueryProvider } from "@/providers/query-provider";
import { ThemeProvider, useTheme } from "@/providers/theme-provider";

function ThemedRoot() {
	const { resolvedScheme } = useTheme();

	return (
		<>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="(tabs)" />
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
								<AnonymousSessionProvider>
									<GuestSessionProvider>
										<PushBridgeProvider>
											<ThemeProvider>
												<AuthGate>
													<ThemedRoot />
												</AuthGate>
											</ThemeProvider>
										</PushBridgeProvider>
									</GuestSessionProvider>
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
