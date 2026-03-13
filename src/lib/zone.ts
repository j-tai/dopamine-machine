import Rect from '$lib/rect';
import Vec2 from '$lib/vec2';

export const NUM_ZONES = 4;

/** Returns the bounding box of the specified zone. */
export function getZoneRect(zone: number, isPlayer: boolean): Rect {
	// Zone 0 is centered at (0, 0), zone 1 is directly to the right, etc.
	const centerX = WIDTH_PER_ZONE * zone;
	const width = WIDTH_PER_ZONE;
	const height = isPlayer ? HEIGHT_FOR_PLAYER : HEIGHT_FOR_ENEMIES;

	return Rect.fromCenterAndSize(new Vec2(centerX, 0), new Vec2(width, height));
}

export const WIDTH_PER_ZONE = 4000;
export const HEIGHT_FOR_PLAYER = 12_000;
export const HEIGHT_FOR_ENEMIES = 16_000;
