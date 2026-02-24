import { describe, expect, test } from 'vitest';
import { getZoneRect, PHYSICS } from '$lib/models';
import Rect from '$lib/rect';
import Vec2 from '$lib/vec2';

describe('getZoneRect', () => {
	test('zone 0', () => {
		expect(getZoneRect(0, 1, true)).toEqual(
			Rect.fromCenterAndSize(
				Vec2.ZERO,
				new Vec2(PHYSICS.WIDTH_PER_ZONE, PHYSICS.HEIGHT_FOR_PLAYER),
			),
		);
	});

	test('zone 1', () => {
		expect(getZoneRect(1, 2, true)).toEqual(
			Rect.fromCenterAndSize(
				new Vec2(PHYSICS.WIDTH_PER_ZONE, 0),
				new Vec2(PHYSICS.WIDTH_PER_ZONE, PHYSICS.HEIGHT_FOR_PLAYER),
			),
		);
	});

	test('zone 2-3', () => {
		expect(getZoneRect(2, 4, true)).toEqual(
			Rect.fromCenterAndSize(
				new Vec2(PHYSICS.WIDTH_PER_ZONE * 2.5, 0),
				new Vec2(PHYSICS.WIDTH_PER_ZONE * 2, PHYSICS.HEIGHT_FOR_PLAYER),
			),
		);
	});
});
