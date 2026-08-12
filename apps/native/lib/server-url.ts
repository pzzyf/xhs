import { getServerUrl } from "@xhs/env/native";
import { Platform } from "react-native";

const defaultServerUrl = Platform.select({
	android: "http://10.0.2.2:3000",
	default: "http://localhost:3000",
});

export const nativeServerUrl = getServerUrl(defaultServerUrl).replace(
	/\/$/,
	"",
);
