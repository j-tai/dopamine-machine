import { describe, expect, test } from 'vitest';
import Vec2 from '$lib/vec2';

const TAU = Math.PI * 2;

describe('Vec2', () => {
	test('ZERO', () => {
		expect(Vec2.ZERO).toEqual(new Vec2(0, 0));
	});

	test('neg', () => {
		expect(new Vec2(12, 34).neg()).toEqual(new Vec2(-12, -34));
	});

	test('add', () => {
		expect(new Vec2(1, 2).add(new Vec2(3, 4))).toEqual(new Vec2(4, 6));
		expect(new Vec2(-1, 5).add(new Vec2(10, -2))).toEqual(new Vec2(9, 3));
	});

	test('sub', () => {
		expect(new Vec2(10, 20).sub(new Vec2(3, 4))).toEqual(new Vec2(7, 16));
		expect(new Vec2(-1, 5).sub(new Vec2(10, -2))).toEqual(new Vec2(-11, 7));
	});

	test('scale', () => {
		expect(new Vec2(3, -4).scale(2)).toEqual(new Vec2(6, -8));
		expect(new Vec2(3, -4).scale(0)).toEqual(new Vec2(0, -0));
		expect(new Vec2(3, -4).scale(-1)).toEqual(new Vec2(-3, 4));
	});

	test('length', () => {
		expect(new Vec2(3, 4).length()).toBeCloseTo(5, 12);
		expect(new Vec2(0, 0).length()).toBeCloseTo(0, 12);
	});

	test('lengthSq', () => {
		expect(new Vec2(3, 4).lengthSq()).toBe(25);
		expect(new Vec2(-3, 4).lengthSq()).toBe(25);
	});

	test('normalize (non-zero)', () => {
		const v = new Vec2(3, 4).normalize();
		expect(v.x).toBeCloseTo(0.6, 12);
		expect(v.y).toBeCloseTo(0.8, 12);
		expect(v.length()).toBeCloseTo(1, 12);
	});

	test('normalize (zero vector)', () => {
		const n = new Vec2(0, 0).normalize();
		expect(n).toBe(Vec2.ZERO); // same instance per implementation
		expect(n).toEqual(new Vec2(0, 0));
	});

	test('abs', () => {
		expect(new Vec2(-3, 4).abs()).toEqual(new Vec2(3, 4));
		expect(new Vec2(3, -4).abs()).toEqual(new Vec2(3, 4));
		expect(new Vec2(0, -0).abs()).toEqual(new Vec2(0, 0));
	});

	test('angle', () => {
		expect(new Vec2(1, 0).angle()).toBeCloseTo(0, 12);
		expect(new Vec2(0, 1).angle()).toBeCloseTo(Math.PI / 2, 12);
		expect(new Vec2(-1, 0).angle()).toBeCloseTo(Math.PI, 12);
		expect(new Vec2(0, -1).angle()).toBeCloseTo(-Math.PI / 2, 12);
	});

	test('fromAngle', () => {
		const v0 = Vec2.fromAngle(0);
		expect(v0.x).toBeCloseTo(1, 12);
		expect(v0.y).toBeCloseTo(0, 12);

		const v90 = Vec2.fromAngle(Math.PI / 2);
		expect(v90.x).toBeCloseTo(0, 12);
		expect(v90.y).toBeCloseTo(1, 12);

		// periodicity sanity check
		const vTau = Vec2.fromAngle(TAU);
		expect(vTau.x).toBeCloseTo(1, 12);
		expect(vTau.y).toBeCloseTo(0, 12);
	});

	test('rotate', () => {
		const v = new Vec2(1, 0).rotate(Math.PI / 2);
		expect(v.x).toBeCloseTo(0, 12);
		expect(v.y).toBeCloseTo(1, 12);

		const w = new Vec2(3, 4).rotate(0);
		expect(w).toEqual(new Vec2(3, 4));

		// rotate by π should negate
		const u = new Vec2(2, -5).rotate(Math.PI);
		expect(u.x).toBeCloseTo(-2, 12);
		expect(u.y).toBeCloseTo(5, 12);
	});

	test('dot', () => {
		expect(new Vec2(1, 2).dot(new Vec2(3, 4))).toBe(11);
		expect(new Vec2(3, 4).dot(new Vec2(3, 4))).toBe(25); // equals lengthSq
		expect(new Vec2(1, 0).dot(new Vec2(0, 1))).toBe(0);
	});
});
