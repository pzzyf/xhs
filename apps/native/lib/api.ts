import { env } from "@xhs/env/native";
import { Platform } from "react-native";

import { createAbortSignalWithTimeout } from "./abort-signal";

const defaultApiBaseUrl = Platform.select({
	android: "http://10.0.2.2:3000",
	default: "http://localhost:3000",
});

export const apiBaseUrl = (
	env.EXPO_PUBLIC_SERVER_URL ?? defaultApiBaseUrl
).replace(/\/$/, "");

export const DEFAULT_API_TIMEOUT_MS = 10_000;

type ApiPath = `/${string}`;
type FetchOptions = NonNullable<Parameters<typeof fetch>[1]>;
type FetchInput = Parameters<typeof fetch>[0];
export type ApiTextOptions = FetchOptions & {
	timeoutMs?: number;
};

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

export class ApiTimeoutError extends Error {
	readonly timeoutMs: number;

	constructor(timeoutMs: number) {
		super(`请求超时：${timeoutMs}ms`);
		this.name = "ApiTimeoutError";
		this.timeoutMs = timeoutMs;
	}
}

export async function fetchWithTimeout(
	input: FetchInput,
	init: RequestInit & { timeoutMs?: number } = {},
) {
	const { timeoutMs = DEFAULT_API_TIMEOUT_MS, ...requestInit } = init;
	const { cleanup, didTimeout, signal } = createAbortSignalWithTimeout(
		timeoutMs,
		requestInit.signal,
	);

	try {
		return await fetch(input, {
			...requestInit,
			signal,
		});
	} catch (error) {
		if (didTimeout()) {
			throw new ApiTimeoutError(timeoutMs);
		}

		throw error;
	} finally {
		cleanup();
	}
}

export async function apiText(path: ApiPath, init: ApiTextOptions = {}) {
	const headers = new Headers(init.headers);

	if (!headers.has("Accept")) {
		headers.set("Accept", "application/json, text/plain");
	}

	const response = await fetchWithTimeout(`${apiBaseUrl}${path}`, {
		...init,
		headers,
	});
	const body = await response.text();

	if (!response.ok) {
		throw new ApiError(response, body);
	}

	return body;
}
