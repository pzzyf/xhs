import { describe, expect, test } from "bun:test";

import { validateAuthForm } from "./auth-form";

describe("validateAuthForm", () => {
	test("注册时规范化昵称与邮箱并保留密码", () => {
		expect(
			validateAuthForm({
				mode: "sign-up",
				name: "  小艾  ",
				email: "  TEST@Example.COM ",
				password: "password123",
			}),
		).toEqual({
			ok: true,
			data: {
				name: "小艾",
				email: "test@example.com",
				password: "password123",
			},
		});
	});

	test("注册时拒绝空昵称", () => {
		expect(
			validateAuthForm({
				mode: "sign-up",
				name: "  ",
				email: "test@example.com",
				password: "password123",
			}),
		).toEqual({ ok: false, message: "请输入昵称" });
	});

	test("拒绝格式无效的邮箱", () => {
		expect(
			validateAuthForm({
				mode: "sign-in",
				name: "",
				email: "not-an-email",
				password: "password123",
			}),
		).toEqual({ ok: false, message: "请输入有效邮箱" });
	});

	test("拒绝少于八位的密码", () => {
		expect(
			validateAuthForm({
				mode: "sign-in",
				name: "",
				email: "test@example.com",
				password: "short",
			}),
		).toEqual({ ok: false, message: "密码至少 8 位" });
	});
});
