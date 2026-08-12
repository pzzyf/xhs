import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SEED_NOTES } from "./seed";

/**
 * 把仓库内精选照片（seed-photos/note-XX.jpg）上传到指定环境的 R2：
 *   bun seed:images [serverUrl]
 * 默认 serverUrl = http://localhost:3000（alchemy dev）。
 * 密钥读取 apps/server/.env 的 SEED_SECRET（与 alchemy 配置同源）。
 */
const serverUrl = (process.argv[2] ?? "http://localhost:3000").replace(
	/\/+$/,
	"",
);

function readEnvFile(filePath: string): Record<string, string> {
	if (!existsSync(filePath)) {
		return {};
	}
	const result: Record<string, string> = {};
	for (const line of readFileSync(filePath, "utf8").split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const equals = trimmed.indexOf("=");
		if (equals <= 0) continue;
		result[trimmed.slice(0, equals).trim()] = trimmed.slice(equals + 1).trim();
	}
	return result;
}

const seedSecret =
	process.env.SEED_SECRET ??
	readEnvFile(
		fileURLToPath(new URL("../../../apps/server/.env", import.meta.url)),
	).SEED_SECRET;

if (!seedSecret) {
	console.error("缺少 SEED_SECRET（apps/server/.env）");
	process.exit(1);
}

let uploaded = 0;
for (let i = 0; i < SEED_NOTES.length; i++) {
	const note = SEED_NOTES[i];
	if (!note) continue;

	const photoPath = fileURLToPath(
		new URL(
			`../seed-photos/note-${String(i + 1).padStart(2, "0")}.jpg`,
			import.meta.url,
		),
	);
	if (!existsSync(photoPath)) {
		console.warn(`跳过 ${note.imageKey}：缺少 ${path.basename(photoPath)}`);
		continue;
	}

	const bytes = readFileSync(photoPath);
	const url = `${serverUrl}/api/dev/seed/images/${encodeURIComponent(note.imageKey)}`;
	const response = await fetch(url, {
		method: "PUT",
		headers: {
			"x-seed-secret": seedSecret,
			"content-type": "image/jpeg",
		},
		body: bytes,
	});
	const body: unknown = await response.json().catch(() => null);
	if (!response.ok) {
		console.error(
			`失败 ${note.imageKey}：${response.status} ${JSON.stringify(body)}`,
		);
		process.exitCode = 1;
		continue;
	}
	uploaded += 1;
	console.log(`OK ${note.imageKey} ${bytes.length}B`);
}

console.log(`完成：上传 ${uploaded}/${SEED_NOTES.length} 张`);
