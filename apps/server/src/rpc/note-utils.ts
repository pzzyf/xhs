import { z } from "zod";

const tagsSchema = z.array(z.string());

export function parseTags(value: string): string[] {
	return tagsSchema.parse(JSON.parse(value));
}

export function buildImageUrl(origin: string, imageKey: string): string {
	const encodedKey = imageKey.split("/").map(encodeURIComponent).join("/");
	return `${origin.replace(/\/$/, "")}/images/${encodedKey}`;
}

export function splitPage<T extends { id: number }>(rows: T[], limit: number) {
	const hasNextPage = rows.length > limit;
	const items = rows.slice(0, limit);
	const lastItem = items[items.length - 1];

	return {
		items,
		nextCursor: hasNextPage && lastItem ? String(lastItem.id) : null,
	};
}
