import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: "#f25555",
				tabBarInactiveTintColor: "#737373",
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
