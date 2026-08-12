import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/providers/theme-provider";

type AvatarProps = {
	name: string;
	size?: number;
};

export function Avatar({ name, size = 72 }: AvatarProps) {
	const { colors } = useTheme();
	const initial = name.trim().slice(0, 1) || "访";

	return (
		<View
			style={[
				styles.circle,
				{
					backgroundColor: colors.accent,
					borderRadius: size / 2,
					height: size,
					width: size,
				},
			]}
		>
			<Text style={[styles.text, { fontSize: size * 0.36 }]}>{initial}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	circle: {
		alignItems: "center",
		justifyContent: "center",
	},
	text: {
		color: "#ffffff",
		fontWeight: "800",
	},
});
