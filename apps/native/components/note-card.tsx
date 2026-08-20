import type { NoteListItem } from "@xhs/api";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/providers/theme-provider";

import { getMasonryCoverAspectRatio } from "./note-card-ratio";

type NoteCardProps = {
	note: NoteListItem;
	onPress: (id: string) => void;
};

export function NoteCard({ note, onPress }: NoteCardProps) {
	const { colors } = useTheme();
	const [aspectRatio, setAspectRatio] = useState(() =>
		getMasonryCoverAspectRatio(note.id, 0, 0),
	);

	useEffect(() => {
		let isActive = true;
		setAspectRatio(getMasonryCoverAspectRatio(note.id, 0, 0));

		Image.getSize(
			note.coverUrl,
			(width, height) => {
				if (isActive) {
					setAspectRatio(getMasonryCoverAspectRatio(note.id, width, height));
				}
			},
			() => undefined,
		);

		return () => {
			isActive = false;
		};
	}, [note.coverUrl, note.id]);

	return (
		<Pressable
			onPress={() => onPress(note.id)}
			style={({ pressed }) => [
				styles.card,
				{ backgroundColor: colors.surface, borderColor: colors.border },
				pressed && styles.pressed,
			]}
		>
			<Image
				source={{ uri: note.coverUrl }}
				style={[styles.cover, { aspectRatio }]}
				resizeMode="cover"
			/>
			<View style={styles.copy}>
				<Text
					numberOfLines={2}
					style={[styles.cardTitle, { color: colors.foreground }]}
				>
					{note.title}
				</Text>
				<Text
					numberOfLines={1}
					style={[styles.author, { color: colors.muted }]}
				>
					{note.authorName}
				</Text>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	card: {
		borderRadius: 18,
		borderWidth: 1,
		marginBottom: 12,
		marginHorizontal: 6,
		overflow: "hidden",
	},
	pressed: {
		opacity: 0.72,
	},
	cover: {
		width: "100%",
	},
	copy: {
		gap: 6,
		padding: 10,
	},
	cardTitle: {
		fontSize: 15,
		fontWeight: "700",
		lineHeight: 20,
	},
	author: {
		fontSize: 12,
		lineHeight: 16,
	},
});
