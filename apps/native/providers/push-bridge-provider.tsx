import * as Notifications from "expo-notifications";
import { type Href, router } from "expo-router";
import { type PropsWithChildren, useEffect } from "react";
import { Platform } from "react-native";

function getNotificationHref(response: Notifications.NotificationResponse) {
	const { data } = response.notification.request.content;
	const href = data?.href ?? data?.url;

	return typeof href === "string" && href.startsWith("/") ? href : null;
}

function routeNotification(response: Notifications.NotificationResponse) {
	const href = getNotificationHref(response);

	if (href !== null) {
		router.push(href as Href);
	}
}

export function PushBridgeProvider({ children }: PropsWithChildren) {
	useEffect(() => {
		if (Platform.OS === "web") {
			return;
		}

		const lastResponse = Notifications.getLastNotificationResponse();

		if (lastResponse !== null) {
			routeNotification(lastResponse);
			Notifications.clearLastNotificationResponse();
		}

		const subscription = Notifications.addNotificationResponseReceivedListener(
			(response) => {
				routeNotification(response);
				Notifications.clearLastNotificationResponse();
			},
		);

		return () => {
			subscription.remove();
		};
	}, []);

	return children;
}
