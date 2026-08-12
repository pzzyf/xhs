import { useQueryClient } from "@tanstack/react-query";
import {
	type ImageResult,
	manipulateAsync,
	SaveFormat,
} from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useToast } from "heroui-native/toast";
import { useEffect, useState } from "react";
import {
	Image,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/features/auth/auth-provider";
import { notesKeys } from "@/features/notes/query-options";
import { orpc } from "@/lib/orpc";
import { uploadImage } from "@/lib/upload-image";
import { useTheme } from "@/providers/theme-provider";

const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 20;

export default function PublishScreen() {
	const router = useRouter();
	const { colors } = useTheme();
	const { user, isPending } = useAuth();
	const { toast } = useToast();
	const queryClient = useQueryClient();

	const [imageUri, setImageUri] = useState<string | null>(null);
	const [imageSize, setImageSize] = useState<{
		width: number;
		height: number;
	} | null>(null);
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [tagInput, setTagInput] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!isPending && !user) {
			router.replace("/sign-in");
		}
	}, [isPending, router, user]);

	if (!user) {
		return null;
	}

	const pickImage = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [3, 4],
			quality: 1,
		});
		if (result.canceled) {
			return;
		}
		const asset = result.assets[0];
		if (asset) {
			setImageUri(asset.uri);
			setImageSize({ width: asset.width, height: asset.height });
			setError(null);
		}
	};

	const parseTags = (): string[] => {
		const tags = tagInput
			.split(/[#\s，,]+/)
			.map((tag) => tag.trim())
			.filter(Boolean);
		return [...new Set(tags)].slice(0, MAX_TAGS);
	};

	const validate = (): string | null => {
		if (!imageUri) {
			return "请先选择一张图片";
		}
		if (!title.trim()) {
			return "请填写标题";
		}
		if (!body.trim()) {
			return "请填写正文";
		}
		const tags = parseTags();
		if (tags.some((tag) => tag.length > MAX_TAG_LENGTH)) {
			return `每个标签不超过 ${MAX_TAG_LENGTH} 个字`;
		}
		if (tags.length > MAX_TAGS) {
			return `最多添加 ${MAX_TAGS} 个标签`;
		}
		return null;
	};

	const compressImage = async (): Promise<ImageResult> => {
		const longestEdge = 1600;
		const action =
			imageSize && imageSize.width >= imageSize.height
				? [{ resize: { width: longestEdge } }]
				: [{ resize: { height: longestEdge } }];
		return manipulateAsync(imageUri as string, action, {
			compress: 0.8,
			format: SaveFormat.JPEG,
		});
	};

	const publish = async () => {
		const validationError = validate();
		if (validationError) {
			setError(validationError);
			toast.show({
				label: validationError,
				variant: "warning",
				duration: 2600,
			});
			return;
		}

		setSubmitting(true);
		setError(null);
		try {
			const compressed = await compressImage();
			const uploaded = await uploadImage({
				uri: compressed.uri,
				mimeType: "image/jpeg",
				fileName: "photo.jpg",
			});
			await orpc.notes.create({
				title: title.trim(),
				body: body.trim(),
				tags: parseTags(),
				imageKey: uploaded.imageKey,
			});
			await queryClient.invalidateQueries({
				queryKey: notesKeys.list(),
			});
			toast.show({
				label: "发布成功",
				variant: "success",
				duration: 2500,
			});
			router.replace("/");
		} catch (publishError) {
			const message =
				publishError instanceof Error ? publishError.message : "发布失败";
			setError(message);
			toast.show({
				label: message,
				variant: "danger",
				duration: 3200,
			});
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: colors.background }]}
		>
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<View style={styles.header}>
					<Pressable onPress={() => router.back()} hitSlop={12}>
						<Text style={[styles.cancel, { color: colors.muted }]}>取消</Text>
					</Pressable>
					<Text style={[styles.headerTitle, { color: colors.foreground }]}>
						发布笔记
					</Text>
					<View style={styles.headerSpacer} />
				</View>

				<ScrollView
					contentContainerStyle={styles.scrollContent}
					keyboardShouldPersistTaps="handled"
				>
					<Pressable
						onPress={() => void pickImage()}
						style={[
							styles.picker,
							{
								backgroundColor: colors.surface,
								borderColor: colors.border,
							},
						]}
					>
						{imageUri ? (
							<Image
								source={{ uri: imageUri }}
								style={styles.preview}
								resizeMode="cover"
							/>
						) : (
							<View style={styles.pickerEmpty}>
								<Text
									style={[styles.pickerTitle, { color: colors.foreground }]}
								>
									选择图片
								</Text>
								<Text style={[styles.pickerHint, { color: colors.muted }]}>
									封面建议 3:4，会自动压缩上传
								</Text>
							</View>
						)}
					</Pressable>

					<TextInput
						value={title}
						onChangeText={setTitle}
						placeholder="标题（最多 40 字）"
						placeholderTextColor={colors.muted}
						maxLength={40}
						style={[
							styles.input,
							{
								backgroundColor: colors.surface,
								borderColor: colors.border,
								color: colors.foreground,
							},
						]}
					/>

					<TextInput
						value={body}
						onChangeText={setBody}
						placeholder="写点正文…"
						placeholderTextColor={colors.muted}
						multiline
						numberOfLines={6}
						maxLength={2000}
						style={[
							styles.input,
							styles.bodyInput,
							{
								backgroundColor: colors.surface,
								borderColor: colors.border,
								color: colors.foreground,
							},
						]}
					/>

					<TextInput
						value={tagInput}
						onChangeText={setTagInput}
						placeholder="#标签1 #标签2（最多 5 个）"
						placeholderTextColor={colors.muted}
						style={[
							styles.input,
							{
								backgroundColor: colors.surface,
								borderColor: colors.border,
								color: colors.foreground,
							},
						]}
					/>

					{error ? (
						<Text style={[styles.error, { color: "#e5484d" }]}>{error}</Text>
					) : null}

					<Pressable
						onPress={() => void publish()}
						disabled={submitting}
						style={({ pressed }) => [
							styles.publishButton,
							{
								backgroundColor: colors.accent,
								opacity: submitting ? 0.6 : pressed ? 0.72 : 1,
							},
						]}
					>
						<Text style={styles.publishText}>
							{submitting ? "发布中…" : "发布"}
						</Text>
					</Pressable>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	flex: { flex: 1 },
	header: {
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 14,
	},
	cancel: { fontSize: 15, fontWeight: "600" },
	headerTitle: { fontSize: 18, fontWeight: "800" },
	headerSpacer: { width: 40 },
	scrollContent: { gap: 14, padding: 20, paddingBottom: 48 },
	picker: {
		borderRadius: 20,
		borderStyle: "dashed",
		borderWidth: 1.5,
		overflow: "hidden",
	},
	pickerEmpty: {
		alignItems: "center",
		gap: 6,
		justifyContent: "center",
		minHeight: 260,
		padding: 24,
	},
	pickerTitle: { fontSize: 18, fontWeight: "800" },
	pickerHint: { fontSize: 13, textAlign: "center" },
	preview: { aspectRatio: 3 / 4, width: "100%" },
	input: {
		borderRadius: 14,
		borderWidth: 1,
		fontSize: 15,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	bodyInput: { minHeight: 140, textAlignVertical: "top" },
	error: { fontSize: 14, fontWeight: "600" },
	publishButton: {
		alignItems: "center",
		borderRadius: 999,
		paddingVertical: 14,
	},
	publishText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
});
