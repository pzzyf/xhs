import { count, eq } from "drizzle-orm";
import type { Database } from "./index";
import { notes, user } from "./schema";

export const DEMO_USER_ID = "seed_demo_user";
export const DEMO_EMAIL = "demo@xhs.dev";
export const DEMO_NAME = "体验官小艾";

/** 16 条中文种子笔记（≥1.5 页，page size 10） */
export const SEED_NOTES: Array<{
	title: string;
	body: string;
	tags: string[];
	imageKey: string;
}> = [
	{
		title: "周末咖啡馆打卡",
		body: "藏在巷子里的小店，手冲很稳，窗边位光线正好适合发呆。",
		tags: ["咖啡", "周末", "城市漫步"],
		imageKey: "seed/note-01.png",
	},
	{
		title: "清晨公园慢跑",
		body: "七点的公园人不多，跑道微湿，呼吸里全是树叶的味道。",
		tags: ["运动", "晨跑", "生活"],
		imageKey: "seed/note-02.png",
	},
	{
		title: "自制番茄意面",
		body: "蒜香橄榄油打底，番茄慢炖半小时，简单却很治愈。",
		tags: ["美食", "家常菜", "意面"],
		imageKey: "seed/note-03.png",
	},
	{
		title: "读完一本短篇小说集",
		body: "午后阳光落在书页上，读到最后一页才发现窗外已近黄昏。",
		tags: ["阅读", "文学", "放松"],
		imageKey: "seed/note-04.png",
	},
	{
		title: "阳台绿植换季",
		body: "给龟背竹换了更大的盆，新叶卷着尖，像在打招呼。",
		tags: ["绿植", "家居", "周末"],
		imageKey: "seed/note-05.png",
	},
	{
		title: "夜市小吃清单",
		body: "烤冷面、臭豆腐、糖葫芦，从街口吃到街尾都不嫌远。",
		tags: ["美食", "夜市", "街头"],
		imageKey: "seed/note-06.png",
	},
	{
		title: "胶片相机入门",
		body: "第一卷拍完才明白：慢，也是一种看世界的方式。",
		tags: ["摄影", "胶片", "兴趣"],
		imageKey: "seed/note-07.png",
	},
	{
		title: "雨天室内拉伸",
		body: "跟着视频做了二十分钟，肩颈松了很多，雨声当背景音乐刚刚好。",
		tags: ["运动", "拉伸", "雨天"],
		imageKey: "seed/note-08.png",
	},
	{
		title: "旧物改造小桌",
		body: "二手木板砂光后刷了清漆，变成窗边的咖啡角。",
		tags: ["手工", "家居", "改造"],
		imageKey: "seed/note-09.png",
	},
	{
		title: "城市天台看日落",
		body: "晚高峰的天际线被染成橘色，风很大，心却很静。",
		tags: ["城市", "日落", "散步"],
		imageKey: "seed/note-10.png",
	},
	{
		title: "手作柠檬汽水",
		body: "新鲜柠檬加苏打水，再放两片薄荷，比外卖更清爽。",
		tags: ["饮品", "手作", "夏日"],
		imageKey: "seed/note-11.png",
	},
	{
		title: "博物馆半日游",
		body: "常设展安静得能听见脚步，特别喜欢那件青瓷碗的弧线。",
		tags: ["文化", "展览", "周末"],
		imageKey: "seed/note-12.png",
	},
	{
		title: "整理书桌的仪式感",
		body: "清空抽屉、擦掉键盘灰，重新摆好台灯，效率莫名提升。",
		tags: ["收纳", "效率", "生活"],
		imageKey: "seed/note-13.png",
	},
	{
		title: "第一次尝试陶艺",
		body: "拉坯歪了三次，第四次终于立住了，歪歪扭扭也很可爱。",
		tags: ["手工", "陶艺", "体验"],
		imageKey: "seed/note-14.png",
	},
	{
		title: "地铁上的耳机歌单",
		body: "通勤四十分钟，刚好听完一整张安静的独立专辑。",
		tags: ["音乐", "通勤", "歌单"],
		imageKey: "seed/note-15.png",
	},
	{
		title: "周末市集淘宝",
		body: "买到一只手作陶瓷杯，釉色像清晨的雾，准备每天用来喝黑咖。",
		tags: ["市集", "手作", "周末"],
		imageKey: "seed/note-16.png",
	},
];

/** 8 色渐变占位 PNG 的 key 循环使用（由 generate-seed-pngs 写入 R2） */
export const SEED_IMAGE_KEYS = SEED_NOTES.map((n) => n.imageKey);

export type SeedResult = {
	ok: true;
	skipped: boolean;
	users: number;
	notes: number;
	message: string;
};

/**
 * 幂等种子：已有 demo 用户且 notes≥16 则跳过。
 * 图片需调用方事先写入 R2（key 见 SEED_NOTES.imageKey）。
 */
export async function runSeed(db: Database): Promise<SeedResult> {
	const [noteCountRow] = await db.select({ value: count() }).from(notes);
	const noteCount = noteCountRow?.value ?? 0;

	const existing = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, DEMO_EMAIL))
		.limit(1);

	if (existing.length > 0 && noteCount >= SEED_NOTES.length) {
		return {
			ok: true,
			skipped: true,
			users: 1,
			notes: noteCount,
			message: "种子已存在，跳过",
		};
	}

	const now = new Date();
	if (existing.length === 0) {
		await db.insert(user).values({
			id: DEMO_USER_ID,
			name: DEMO_NAME,
			email: DEMO_EMAIL,
			emailVerified: true,
			image: null,
			createdAt: now,
			updatedAt: now,
		});
	}

	const authorId = existing[0]?.id ?? DEMO_USER_ID;

	if (noteCount < SEED_NOTES.length) {
		const base = Date.now();
		// 时间倒序错开：最新的在前
		const rows = SEED_NOTES.map((item, index) => ({
			authorId,
			title: item.title,
			body: item.body,
			tags: JSON.stringify(item.tags),
			imageKey: item.imageKey,
			createdAt: base - index * 3_600_000,
		}));
		await db.insert(notes).values(rows);
	}

	const [finalNotesRow] = await db.select({ value: count() }).from(notes);

	return {
		ok: true,
		skipped: false,
		users: 1,
		notes: finalNotesRow?.value ?? 0,
		message: "种子写入完成",
	};
}
