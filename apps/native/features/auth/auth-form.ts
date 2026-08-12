export type AuthMode = "sign-in" | "sign-up";

export interface AuthFormInput {
	mode: AuthMode;
	name: string;
	email: string;
	password: string;
}

export function validateAuthForm(input: AuthFormInput) {
	const name = input.name.trim();
	const email = input.email.trim().toLowerCase();

	if (input.mode === "sign-up" && !name) {
		return { ok: false as const, message: "请输入昵称" };
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return { ok: false as const, message: "请输入有效邮箱" };
	}

	if (input.password.length < 8) {
		return { ok: false as const, message: "密码至少 8 位" };
	}

	return {
		ok: true as const,
		data: {
			name,
			email,
			password: input.password,
		},
	};
}
