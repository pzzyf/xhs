import { apiText } from "../../lib/api";

export const homeGreetingQueryKey = ["home", "greeting"] as const;

export function getHomeGreeting() {
	return apiText("/");
}
