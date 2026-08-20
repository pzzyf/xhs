export const DEFAULT_NOTE_COVER_RATIO = 3 / 4;

const MASONRY_FALLBACK_RATIOS = [0.82, 1.06, 0.92, 1.18, 0.76, 1] as const;

export function getCoverAspectRatio(width: number, height: number) {
	return Number.isFinite(width) &&
		Number.isFinite(height) &&
		width > 0 &&
		height > 0
		? width / height
		: DEFAULT_NOTE_COVER_RATIO;
}

export function getMasonryCoverAspectRatio(
	noteId: string,
	width: number,
	height: number,
) {
	const ratio = getCoverAspectRatio(width, height);

	if (ratio !== DEFAULT_NOTE_COVER_RATIO) {
		return ratio;
	}

	let hash = 0;
	for (const character of noteId) {
		hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
	}

	return MASONRY_FALLBACK_RATIOS[hash % MASONRY_FALLBACK_RATIOS.length];
}
