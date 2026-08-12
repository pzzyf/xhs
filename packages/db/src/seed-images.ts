import { deflateSync } from "node:zlib";

/** 种子占位图：纯色/渐变 PNG 运行时自生成（无外网图源、无版权风险） */

const PNG_SIGNATURE = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		table[n] = c >>> 0;
	}
	return table;
})();

function crc32(data: Uint8Array): number {
	let crc = 0xffffffff;
	for (let i = 0; i < data.length; i++) {
		const byte = data[i];
		if (byte === undefined) continue;
		crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
	const typeBytes = new TextEncoder().encode(type);
	const out = new Uint8Array(12 + data.length);
	const view = new DataView(out.buffer);
	view.setUint32(0, data.length);
	out.set(typeBytes, 4);
	out.set(data, 8);
	view.setUint32(8 + data.length, crc32(concat(typeBytes, data)));
	return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
	const total = parts.reduce((sum, p) => sum + p.length, 0);
	const out = new Uint8Array(total);
	let offset = 0;
	for (const part of parts) {
		out.set(part, offset);
		offset += part.length;
	}
	return out;
}

export type Rgb = readonly [number, number, number];

/** 竖向线性渐变 RGB 真彩 PNG */
export function gradientPng(
	width: number,
	height: number,
	from: Rgb,
	to: Rgb,
): Uint8Array {
	const ihdr = new Uint8Array(13);
	const ihdrView = new DataView(ihdr.buffer);
	ihdrView.setUint32(0, width);
	ihdrView.setUint32(4, height);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 2; // color type: truecolor RGB
	ihdr[10] = 0;
	ihdr[11] = 0;
	ihdr[12] = 0;

	const stride = width * 3;
	const raw = new Uint8Array(height * (stride + 1));
	for (let y = 0; y < height; y++) {
		const t = height <= 1 ? 0 : y / (height - 1);
		const r = Math.round(from[0] + (to[0] - from[0]) * t);
		const g = Math.round(from[1] + (to[1] - from[1]) * t);
		const b = Math.round(from[2] + (to[2] - from[2]) * t);
		const rowStart = y * (stride + 1);
		raw[rowStart] = 0; // filter: none
		for (let x = 0; x < width; x++) {
			const p = rowStart + 1 + x * 3;
			raw[p] = r;
			raw[p + 1] = g;
			raw[p + 2] = b;
		}
	}

	const idat = new Uint8Array(deflateSync(raw));
	return concat(
		PNG_SIGNATURE,
		chunk("IHDR", ihdr),
		chunk("IDAT", idat),
		chunk("IEND", new Uint8Array(0)),
	);
}

/** 16 组渐变配色（青绿主色系 + 柔和中性色） */
export const SEED_GRADIENTS: ReadonlyArray<readonly [Rgb, Rgb]> = [
	[
		[22, 160, 133],
		[26, 188, 156],
	],
	[
		[26, 188, 156],
		[72, 201, 176],
	],
	[
		[22, 160, 133],
		[243, 156, 18],
	],
	[
		[41, 128, 185],
		[93, 173, 226],
	],
	[
		[142, 68, 173],
		[187, 143, 206],
	],
	[
		[231, 76, 60],
		[241, 148, 138],
	],
	[
		[243, 156, 18],
		[248, 196, 113],
	],
	[
		[39, 174, 96],
		[130, 224, 170],
	],
	[
		[22, 160, 133],
		[210, 218, 226],
	],
	[
		[52, 73, 94],
		[127, 140, 141],
	],
	[
		[26, 188, 156],
		[243, 156, 18],
	],
	[
		[41, 128, 185],
		[22, 160, 133],
	],
	[
		[155, 89, 182],
		[52, 152, 219],
	],
	[
		[192, 57, 43],
		[243, 156, 18],
	],
	[
		[39, 174, 96],
		[41, 128, 185],
	],
	[
		[22, 160, 133],
		[52, 73, 94],
	],
];

/** 封面 3:4 近似比例（spec §4.3） */
export const SEED_IMAGE_WIDTH = 480;
export const SEED_IMAGE_HEIGHT = 640;

export function seedImageBytes(index: number): Uint8Array {
	const gradient = SEED_GRADIENTS[index % SEED_GRADIENTS.length];
	if (!gradient) {
		throw new Error(`missing seed gradient for index ${index}`);
	}
	return gradientPng(
		SEED_IMAGE_WIDTH,
		SEED_IMAGE_HEIGHT,
		gradient[0],
		gradient[1],
	);
}
