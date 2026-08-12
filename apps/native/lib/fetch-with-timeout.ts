export function fetchWithTimeout(request: Request, timeoutMs = 10_000) {
	const signal = AbortSignal.any([
		request.signal,
		AbortSignal.timeout(timeoutMs),
	]);

	return fetch(
		new Request(request, {
			credentials: "include",
			signal,
		}),
	);
}
