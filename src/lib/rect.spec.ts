import { describe, expect, test } from 'vitest';
import Rect from '$lib/rect';
import Vec2 from '$lib/vec2';

describe('Rect', () => {
	test('constructor', () => {
		const rect = new Rect(1, 5, 2, 8);
		expect(rect.minX).toBe(1);
		expect(rect.maxX).toBe(5);
		expect(rect.minY).toBe(2);
		expect(rect.maxY).toBe(8);
	});

	test('min getter', () => {
		const rect = new Rect(1, 5, 2, 8);
		expect(rect.min).toEqual(new Vec2(1, 2));
	});

	test('max getter', () => {
		const rect = new Rect(1, 5, 2, 8);
		expect(rect.max).toEqual(new Vec2(5, 8));
	});

	test('center getter', () => {
		const rect = new Rect(0, 10, 0, 20);
		expect(rect.center).toEqual(new Vec2(5, 10));

		const rect2 = new Rect(-4, 4, -6, 6);
		expect(rect2.center).toEqual(new Vec2(0, 0));
	});

	test('size getter', () => {
		const rect = new Rect(1, 5, 2, 8);
		expect(rect.size).toEqual(new Vec2(4, 6));

		const rect2 = new Rect(-2, 3, -5, 10);
		expect(rect2.size).toEqual(new Vec2(5, 15));
	});

	test('fromCorners', () => {
		const rect1 = Rect.fromCorners(new Vec2(1, 2), new Vec2(5, 8));
		expect(rect1).toEqual(new Rect(1, 5, 2, 8));

		// Opposite order should work the same
		const rect2 = Rect.fromCorners(new Vec2(5, 8), new Vec2(1, 2));
		expect(rect2).toEqual(new Rect(1, 5, 2, 8));

		// Mixed order corners
		const rect3 = Rect.fromCorners(new Vec2(10, 2), new Vec2(3, 15));
		expect(rect3).toEqual(new Rect(3, 10, 2, 15));
	});

	test('fromCenterAndSize', () => {
		const rect = Rect.fromCenterAndSize(new Vec2(5, 10), new Vec2(4, 6));
		expect(rect).toEqual(new Rect(3, 7, 7, 13));

		// Center at origin
		const rect2 = Rect.fromCenterAndSize(new Vec2(0, 0), new Vec2(10, 20));
		expect(rect2).toEqual(new Rect(-5, 5, -10, 10));

		// Negative size should be handled (abs applied)
		const rect3 = Rect.fromCenterAndSize(new Vec2(5, 5), new Vec2(-4, -6));
		expect(rect3).toEqual(new Rect(3, 7, 2, 8));
	});

	test('fromCornerAndSize', () => {
		const rect = Rect.fromCornerAndSize(new Vec2(1, 2), new Vec2(4, 6));
		expect(rect).toEqual(new Rect(1, 5, 2, 8));

		// Negative size
		const rect2 = Rect.fromCornerAndSize(new Vec2(5, 10), new Vec2(-3, -4));
		expect(rect2).toEqual(new Rect(2, 5, 6, 10));
	});

	test('contains (inside)', () => {
		const rect = new Rect(0, 10, 0, 10);
		expect(rect.contains(new Vec2(5, 5))).toBe(true);
		expect(rect.contains(new Vec2(1, 1))).toBe(true);
		expect(rect.contains(new Vec2(9, 9))).toBe(true);
	});

	test('contains (boundary)', () => {
		const rect = new Rect(0, 10, 0, 10);
		expect(rect.contains(new Vec2(0, 0))).toBe(true);
		expect(rect.contains(new Vec2(10, 10))).toBe(true);
		expect(rect.contains(new Vec2(0, 5))).toBe(true);
		expect(rect.contains(new Vec2(10, 5))).toBe(true);
		expect(rect.contains(new Vec2(5, 0))).toBe(true);
		expect(rect.contains(new Vec2(5, 10))).toBe(true);
	});

	test('contains (outside)', () => {
		const rect = new Rect(0, 10, 0, 10);
		expect(rect.contains(new Vec2(-1, 5))).toBe(false);
		expect(rect.contains(new Vec2(11, 5))).toBe(false);
		expect(rect.contains(new Vec2(5, -1))).toBe(false);
		expect(rect.contains(new Vec2(5, 11))).toBe(false);
		expect(rect.contains(new Vec2(-5, -5))).toBe(false);
		expect(rect.contains(new Vec2(15, 15))).toBe(false);
	});

	test('clamp (inside point)', () => {
		const rect = new Rect(0, 10, 0, 10);
		const point = new Vec2(5, 5);
		expect(rect.clamp(point)).toBe(point); // Should return same instance
		expect(rect.clamp(new Vec2(3, 7))).toEqual(new Vec2(3, 7));
	});

	test('clamp (outside point)', () => {
		const rect = new Rect(0, 10, 0, 10);
		expect(rect.clamp(new Vec2(-5, 5))).toEqual(new Vec2(0, 5));
		expect(rect.clamp(new Vec2(15, 5))).toEqual(new Vec2(10, 5));
		expect(rect.clamp(new Vec2(5, -5))).toEqual(new Vec2(5, 0));
		expect(rect.clamp(new Vec2(5, 15))).toEqual(new Vec2(5, 10));
		expect(rect.clamp(new Vec2(-5, -5))).toEqual(new Vec2(0, 0));
		expect(rect.clamp(new Vec2(15, 15))).toEqual(new Vec2(10, 10));
	});

	test('clamp (boundary point)', () => {
		const rect = new Rect(0, 10, 0, 10);
		const corner = new Vec2(0, 0);
		expect(rect.clamp(corner)).toBe(corner); // Should return same instance
		expect(rect.clamp(new Vec2(10, 10))).toEqual(new Vec2(10, 10));
	});

	test('withSize', () => {
		const rect = new Rect(0, 10, 0, 20);
		const newRect = rect.withSize(new Vec2(6, 8));

		expect(newRect.center).toEqual(rect.center); // Center should remain the same
		expect(newRect.size).toEqual(new Vec2(6, 8));
		expect(newRect).toEqual(new Rect(2, 8, 6, 14));

		// Original should be unchanged (immutability)
		expect(rect).toEqual(new Rect(0, 10, 0, 20));
	});
});
