export type AbortSignalWithTimeout = {
	signal: AbortSignal;
	cleanup: () => void;
	didTimeout: () => boolean;
};

export function createAbortSignalWithTimeout(
	timeoutMs: number,
	callerSignal?: AbortSignal | null,
): AbortSignalWithTimeout {
	const controller = new AbortController();
	let timedOut = false;

	const abortFromCaller = () => {
		controller.abort();
	};

	if (callerSignal?.aborted) {
		controller.abort();
	} else {
		callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
	}

	const timer =
		timeoutMs > 0
			? setTimeout(() => {
					timedOut = true;
					controller.abort();
				}, timeoutMs)
			: null;

	return {
		signal: controller.signal,
		cleanup: () => {
			if (timer !== null) {
				clearTimeout(timer);
			}
			callerSignal?.removeEventListener("abort", abortFromCaller);
		},
		didTimeout: () => timedOut,
	};
}
