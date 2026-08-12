import { Platform } from "react-native";
import { authClient } from "./auth-client";
import { nativeServerUrl } from "./server-url";

export type UploadImageInput = {
	uri: string;
	mimeType: string;
	fileName: string;
};

export type UploadImageResult = {
	imageKey: string;
	imageUrl: string;
};

export async function uploadImage(
	file: UploadImageInput,
	timeoutMs = 30_000,
): Promise<UploadImageResult> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	const cookie = Platform.OS === "web" ? "" : authClient.getCookie();
	const headers: Record<string, string> = {
		"Content-Type": file.mimeType,
		"expo-origin": "xhs://",
		...(cookie ? { cookie } : {}),
	};
	// Web 用 Blob；Native 由 RN 网络层把 { uri, type, name } 作为文件请求体发送。
	const body =
		Platform.OS === "web"
			? await (await fetch(file.uri)).blob()
			: { uri: file.uri, name: file.fileName, type: file.mimeType };

	try {
		const response = await fetch(`${nativeServerUrl}/api/images`, {
			method: "PUT",
			headers,
			body: body as BodyInit,
			credentials: "include",
			signal: controller.signal,
		});
		const payload = (await response.json().catch(() => null)) as
			| (UploadImageResult & { error?: string })
			| null;

		if (!response.ok) {
			throw new Error(payload?.error ?? "图片上传失败");
		}
		if (!payload?.imageKey) {
			throw new Error("图片上传失败");
		}
		return payload;
	} finally {
		clearTimeout(timeout);
	}
}
