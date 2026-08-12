import { expect, test } from "bun:test";

import { getServerUrl } from "../src/native";

test("环境变量缺失时使用调用方提供的平台默认地址", () => {
	expect(getServerUrl("http://10.0.2.2:3000", {})).toBe("http://10.0.2.2:3000");
});

test("显式环境变量优先于平台默认地址", () => {
	expect(
		getServerUrl("http://10.0.2.2:3000", {
			EXPO_PUBLIC_SERVER_URL: "https://api.example.com",
		}),
	).toBe("https://api.example.com");
});
