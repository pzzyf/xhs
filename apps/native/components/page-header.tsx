import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/providers/theme-provider";

type PageHeaderProps = {
	title: string;
	eyebrow?: string;
	action?: ReactNode;
};

export function PageHeader({ title, eyebrow, action }: PageHeaderProps) {
	const { colors } = useTheme();

	return (
		<View style={styles.header}>
			<View>
				{eyebrow ? (
					<Text style={[styles.eyebrow, { color: colors.accent }]}>
						{eyebrow}
					</Text>
				) : null}
				<Text style={[styles.title, { color: colors.foreground }]}>
					{title}
				</Text>
			</View>
			{action}
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 18,
	},
	eyebrow: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
	title: { fontSize: 30, fontWeight: "800" },
});
