import { router, useSegments } from "expo-router";
import { type PropsWithChildren, useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/providers/theme-provider";

import { useGuestSession } from "./guest-session-provider";

export function AuthGate({ children }: PropsWithChildren) {
	const { colors } = useTheme();
	const segments = useSegments();
	const { data: session, isPending } = authClient.useSession();
	const { isGuest, isReady: guestReady } = useGuestSession();
	const isSignInScreen = segments[0] === "sign-in";
	const canEnter = session !== null || isGuest;
	const shouldRedirect =
		!isPending &&
		guestReady &&
		((!canEnter && !isSignInScreen) || (canEnter && isSignInScreen));
	const showLoading = isPending || !guestReady || shouldRedirect;

	useEffect(() => {
		if (isPending || !guestReady) {
			return;
		}

		if (!canEnter && !isSignInScreen) {
			router.replace("/sign-in");
		} else if (canEnter && isSignInScreen) {
			router.replace("/");
		}
	}, [canEnter, guestReady, isPending, isSignInScreen]);

	return (
		<View style={styles.fill}>
			{children}
			{showLoading ? (
				<View style={[styles.overlay, { backgroundColor: colors.background }]}>
					<ActivityIndicator color={colors.accent} />
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	fill: {
		flex: 1,
	},
	overlay: {
		alignItems: "center",
		bottom: 0,
		justifyContent: "center",
		left: 0,
		position: "absolute",
		right: 0,
		top: 0,
	},
});
