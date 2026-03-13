import { type SaveDataType } from '$lib/models';
import { ZstdInit } from '@oneidentity/zstd-js';
import Polynomial from '$lib/polynomial';

// let cachedZstd: typeof ZstdSimple | null = null;
const zstd = (await ZstdInit()).ZstdSimple;

export function marshalToBase64(data: SaveDataType): string {
	const jsonData = ENCODER.encode(JSON.stringify(data, replacer));
	const compressed = zstd.compress(jsonData, 19);
	return encodeBase64(compressed);
}

export function unmarshalFromBase64(base64: string): SaveDataType | null {
	try {
		const compressed = decodeBase64(base64);
		const jsonData = zstd.decompress(compressed);
		return JSON.parse(DECODER.decode(jsonData), reviver);
	} catch (e) {
		console.error('Could not unmarshal save data: ', e);
		return null;
	}
}

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

function encodeBase64(bytes: Uint8Array): string {
	const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
	return btoa(binary);
}

function decodeBase64(base64: string): Uint8Array {
	const binary = atob(base64);
	return Uint8Array.from(binary, (m) => m.charCodeAt(0));
}

const TYPE_MARKER = '==';

function replacer(key: string, value: unknown): unknown {
	if (value instanceof Polynomial) {
		return {
			[TYPE_MARKER]: 'Polynomial',
			value: value.coefficients,
		};
	}
	return value;
}

function reviver(key: string, value: any): unknown {
	if (typeof value === 'object' && value && TYPE_MARKER in value) {
		const typeMarker = value[TYPE_MARKER];
		if (typeMarker === 'Polynomial') {
			return new Polynomial(value.value);
		}
	}
	return value;
}
