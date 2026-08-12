import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useMemo,
} from "react";

import { authClient } from "@/lib/auth-client";

type AuthUser = {
	id: string;
	name: string;
	email: string;
	image?: string | null;
};

type AuthSession = {
	id: string;
	userId: string;
	expiresAt: Date;
};

type AuthContextValue = {
	user: AuthUser | null;
	session: AuthSession | null;
	isPending: boolean;
	refreshSession: () => Promise<void>;
	signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
	const sessionState = authClient.useSession();

	const refreshSession = useCallback(async () => {
		await sessionState.refetch();
	}, [sessionState.refetch]);

	const signOut = useCallback(async () => {
		const result = await authClient.signOut();
		if (result.error) {
			throw new Error(result.error.message ?? "退出登录失败");
		}
		await sessionState.refetch();
	}, [sessionState.refetch]);

	const value = useMemo<AuthContextValue>(
		() => ({
			user: sessionState.data?.user ?? null,
			session: sessionState.data?.session ?? null,
			isPending: sessionState.isPending,
			refreshSession,
			signOut,
		}),
		[sessionState.isPending, refreshSession, sessionState.data, signOut],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth 必须在 AuthProvider 内使用");
	}
	return context;
}
