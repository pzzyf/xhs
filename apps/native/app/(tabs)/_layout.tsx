import { Tabs } from "expo-router";
import { PlatformPressable } from "expo-router/build/react-navigation/elements";
import type { ComponentProps } from "react";

import { useTheme } from "@/providers/theme-provider";

function TabBarButton({
	style,
	...props
}: ComponentProps<typeof PlatformPressable>) {
	return (
		<PlatformPressable
			{...props}
			style={[style, { justifyContent: "center" }]}
		/>
	);
}

export default function TabsLayout() {
	const { colors } = useTheme();

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: colors.accent,
				tabBarInactiveTintColor: colors.muted,
				tabBarButton: TabBarButton,
				tabBarIcon: () => null,
				tabBarIconStyle: {
					display: "none",
				},
				tabBarStyle: {
					backgroundColor: colors.surface,
					borderTopColor: colors.border,
					height: 64,
					paddingBottom: 8,
					paddingTop: 6,
				},
				tabBarItemStyle: {
					justifyContent: "center",
				},
				tabBarLabelStyle: {
					fontSize: 15,
					lineHeight: 20,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "首页",
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "设置",
				}}
			/>
		</Tabs>
	);
}
