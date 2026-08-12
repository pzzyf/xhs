export function normalizeNoteId(
	value: string | string[] | undefined,
): string | null {
	const id = Array.isArray(value) ? value[0] : value;
	return id && /^[1-9]\d*$/.test(id) ? id : null;
}
