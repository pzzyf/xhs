import NetInfo from "@react-native-community/netinfo";
import {
	focusManager,
	onlineManager,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { type PropsWithChildren, useEffect, useState } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				gcTime: 5 * 60 * 1000,
				refetchOnReconnect: true,
				refetchOnWindowFocus: true,
				retry: 2,
				staleTime: 30 * 1000,
			},
		},
	});
}

function useMobileFocusManager() {
	useEffect(() => {
		if (Platform.OS === "web") {
			return;
		}

		focusManager.setFocused(AppState.currentState === "active");

		const subscription = AppState.addEventListener(
			"change",
			(status: AppStateStatus) => {
				focusManager.setFocused(status === "active");
			},
		);

		return () => {
			subscription.remove();
		};
	}, []);
}

function useMobileOnlineManager() {
	useEffect(() => {
		if (Platform.OS === "web") {
			return;
		}

		return NetInfo.addEventListener((state) => {
			onlineManager.setOnline(
				Boolean(state.isConnected && state.isInternetReachable !== false),
			);
		});
	}, []);
}

function QueryEnvironmentObserver() {
	useMobileFocusManager();
	useMobileOnlineManager();

	return null;
}

export function AppQueryProvider({ children }: PropsWithChildren) {
	const [queryClient] = useState(createQueryClient);

	return (
		<QueryClientProvider client={queryClient}>
			<QueryEnvironmentObserver />
			{children}
		</QueryClientProvider>
	);
}
