import type { PropsWithChildren, ReactNode } from "react";

import { useAuth } from "./auth-provider";

type AuthGateProps = PropsWithChildren<{
	fallback: ReactNode;
	pendingFallback?: ReactNode;
}>;

export function AuthGate({
	children,
	fallback,
	pendingFallback = null,
}: AuthGateProps) {
	const { isPending, user } = useAuth();

	if (isPending) {
		return pendingFallback;
	}

	return user ? children : fallback;
}
