import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

import { useTheme } from "@/providers/theme-provider";

export default function TabsLayout() {
	const { colors } = useTheme();

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: colors.accent,
				tabBarInactiveTintColor: colors.muted,
				tabBarStyle: {
					backgroundColor: colors.surface,
					borderTopColor: colors.border,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "首页",
					tabBarIcon: ({ color, size }) => (
						<Ionicons color={color} name="home" size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "设置",
					tabBarIcon: ({ color, size }) => (
						<Ionicons color={color} name="settings" size={size} />
					),
				}}
			/>
		</Tabs>
	);
}
