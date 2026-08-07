import type {
	ExecutionContext,
	ExportedHandler,
	Request as WorkersRequest,
} from "@cloudflare/workers-types";

import { app } from "./app";
import type { ServerEnv } from "./types";

const worker = {
	fetch: (
		request: WorkersRequest,
		env: ServerEnv,
		executionCtx: ExecutionContext,
	) => app.fetch(request as unknown as Request, env, executionCtx),
};

export default worker as unknown as ExportedHandler<ServerEnv>;
