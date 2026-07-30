import { env } from "@xhs/env/native";
import { Platform } from "react-native";

const defaultApiBaseUrl = Platform.select({
	android: "http://10.0.2.2:3000",
	default: "http://localhost:3000",
});

export const apiBaseUrl = (
	env.EXPO_PUBLIC_SERVER_URL ?? defaultApiBaseUrl
).replace(/\/$/, "");

type ApiPath = `/${string}`;
type FetchOptions = NonNullable<Parameters<typeof fetch>[1]>;

export class ApiError extends Error {
	readonly body: string;
	readonly status: number;

	constructor(response: Response, body: string) {
		super(`请求失败：${response.status} ${response.statusText}`);
		this.name = "ApiError";
		this.body = body;
		this.status = response.status;
	}
}

export async function apiText(path: ApiPath, init?: FetchOptions) {
	const headers = new Headers(init?.headers);

	if (!headers.has("Accept")) {
		headers.set("Accept", "application/json, text/plain");
	}

	const response = await fetch(`${apiBaseUrl}${path}`, {
		...init,
		headers,
	});
	const body = await response.text();

	if (!response.ok) {
		throw new ApiError(response, body);
	}

	return body;
}
