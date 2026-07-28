import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppQueryProvider } from "../providers/query-provider";

export default function RootLayout() {
	return (
		<AppQueryProvider>
			<Stack screenOptions={{ headerShown: false }} />
			<StatusBar style="dark" />
		</AppQueryProvider>
	);
}
