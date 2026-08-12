const bodyReaderMethods = new Set<PropertyKey>([
	"arrayBuffer",
	"blob",
	"formData",
	"json",
	"text",
]);

function withBodyCleanup(response: Response, cleanup: () => void): Response {
	return new Proxy(response, {
		get(target, property) {
			const value = Reflect.get(target, property, target);
			if (typeof value !== "function") return value;
			if (!bodyReaderMethods.has(property)) return value.bind(target);

			return (...args: unknown[]) => {
				try {
					return Promise.resolve(Reflect.apply(value, target, args)).finally(
						cleanup,
					);
				} catch (error) {
					cleanup();
					throw error;
				}
			};
		},
	});
}

export function fetchWithTimeout(request: Request, timeoutMs = 10_000) {
	const callerSignal = request.signal;
	const controller = new AbortController();
	let timeout: ReturnType<typeof setTimeout> | undefined;
	let listeningForCaller = false;

	const cleanup = () => {
		if (timeout !== undefined) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		if (listeningForCaller) {
			callerSignal.removeEventListener("abort", abortRequest);
			listeningForCaller = false;
		}
	};
	const abortRequest = () => {
		controller.abort();
		cleanup();
	};

	if (callerSignal.aborted) {
		controller.abort();
	} else {
		callerSignal.addEventListener("abort", abortRequest, { once: true });
		listeningForCaller = true;
		timeout = setTimeout(abortRequest, timeoutMs);
	}

	return fetch(
		new Request(request, {
			credentials: "include",
			signal: controller.signal,
		}),
	).then(
		(response) => withBodyCleanup(response, cleanup),
		(error) => {
			cleanup();
			throw error;
		},
	);
}
