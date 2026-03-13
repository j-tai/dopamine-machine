import { describe, it, expect } from 'vitest';
import Polynomial from './polynomial';

describe('Polynomial', () => {
	describe('constructor', () => {
		it('should create an empty polynomial with no coefficients', () => {
			const poly = new Polynomial();
			expect(poly.length).toBe(0);
		});

		it('should create a polynomial with given coefficients', () => {
			const poly = new Polynomial([1, 2, 3]);
			expect(poly.coefficients).toEqual([1, 2, 3]);
		});

		it('should normalize trailing zeros on construction', () => {
			const poly = new Polynomial([1, 2, 0, 0]);
			expect(poly.coefficients).toEqual([1, 2]);
		});

		it('should handle all-zero coefficients', () => {
			const poly = new Polynomial([0, 0, 0]);
			expect(poly.length).toBe(0);
		});
	});

	describe('ZERO', () => {
		it('should be a zero polynomial', () => {
			const poly = Polynomial.ZERO;
			expect(poly.length).toBe(0);
			expect(poly.coefficients).toEqual([]);
		});
	});

	describe('ONE', () => {
		it('should be a polynomial equal to 1', () => {
			const poly = Polynomial.ONE;
			expect(poly.length).toBe(1);
			expect(poly.coefficients).toEqual([1]);
		});
	});

	describe('fromTerm()', () => {
		it('should create a polynomial with a single term', () => {
			const poly = Polynomial.fromTerm(2, 5);
			expect(poly.get(2)).toBe(5);
			expect(poly.get(0)).toBe(0);
			expect(poly.get(1)).toBe(0);
		});

		it('should create a constant term', () => {
			const poly = Polynomial.fromTerm(0, 7);
			expect(poly.get(0)).toBe(7);
			expect(poly.length).toBe(1);
		});

		it('should handle zero coefficient', () => {
			const poly = Polynomial.fromTerm(3, 0);
			expect(poly.length).toBe(0);
		});
	});

	describe('length', () => {
		it('should return 0 for empty polynomial', () => {
			const poly = new Polynomial();
			expect(poly.length).toBe(0);
		});

		it('should return correct length for non-empty polynomial', () => {
			const poly = new Polynomial([1, 2, 3]);
			expect(poly.length).toBe(3);
		});

		it('should update after normalization', () => {
			const orig = new Polynomial([1, 2, 3]);
			const poly = orig.with(2, 0);
			expect(poly.length).toBe(2);
		});
	});

	describe('get()', () => {
		it('should return coefficient at given index', () => {
			const poly = new Polynomial([1, 2, 3]);
			expect(poly.get(0)).toBe(1);
			expect(poly.get(1)).toBe(2);
			expect(poly.get(2)).toBe(3);
		});

		it('should return 0 for out of bounds index', () => {
			const poly = new Polynomial([1, 2, 3]);
			expect(poly.get(5)).toBe(0);
			expect(poly.get(100)).toBe(0);
		});

		it('should return 0 for negative index', () => {
			const poly = new Polynomial([1, 2, 3]);
			expect(poly.get(-1)).toBe(0);
		});
	});

	describe('with()', () => {
		it('should set coefficient at given index', () => {
			const orig = new Polynomial([1, 2, 3]);
			const poly = orig.with(1, 5);
			expect(poly.get(1)).toBe(5);
		});

		it('should expand array when setting higher index', () => {
			const orig = new Polynomial([1]);
			const poly = orig.with(3, 7);
			expect(poly.get(3)).toBe(7);
			expect(poly.length).toBe(4);
		});

		it('should normalize after setting to zero', () => {
			const orig = new Polynomial([1, 2, 3]);
			const poly = orig.with(2, 0);
			expect(poly.length).toBe(2);
		});

		it('should handle setting all coefficients to zero', () => {
			const orig = new Polynomial([1]);
			const poly = orig.with(0, 0);
			expect(poly.length).toBe(0);
		});
	});

	describe('add()', () => {
		it('should add two polynomials of same length', () => {
			const poly1 = new Polynomial([1, 2, 3]);
			const poly2 = new Polynomial([4, 5, 6]);
			const result = poly1.add(poly2);
			expect(result.coefficients).toEqual([5, 7, 9]);
		});

		it('should add polynomials of different lengths', () => {
			const poly1 = new Polynomial([1, 2]);
			const poly2 = new Polynomial([3, 4, 5]);
			const result = poly1.add(poly2);
			expect(result.coefficients).toEqual([4, 6, 5]);
		});

		it('should add to empty polynomial', () => {
			const poly1 = new Polynomial();
			const poly2 = new Polynomial([1, 2, 3]);
			const result = poly1.add(poly2);
			expect(result.coefficients).toEqual([1, 2, 3]);
		});

		it('should normalize result with trailing zeros', () => {
			const poly1 = new Polynomial([1, 2, 3]);
			const poly2 = new Polynomial([0, 0, -3]);
			const result = poly1.add(poly2);
			expect(result.coefficients).toEqual([1, 2]);
		});
	});

	describe('sub()', () => {
		it('should subtract two polynomials of same length', () => {
			const poly1 = new Polynomial([5, 7, 9]);
			const poly2 = new Polynomial([1, 2, 3]);
			const result = poly1.sub(poly2);
			expect(result.coefficients).toEqual([4, 5, 6]);
		});

		it('should subtract polynomials of different lengths', () => {
			const poly1 = new Polynomial([3, 4, 5]);
			const poly2 = new Polynomial([1, 2]);
			const result = poly1.sub(poly2);
			expect(result.coefficients).toEqual([2, 2, 5]);
		});

		it('should handle negative results', () => {
			const poly1 = new Polynomial([1, 2]);
			const poly2 = new Polynomial([3, 4, 5]);
			const result = poly1.sub(poly2);
			expect(result.coefficients).toEqual([-2, -2, -5]);
		});

		it('should normalize result', () => {
			const poly1 = new Polynomial([1, 2, 3]);
			const poly2 = new Polynomial([1, 2, 3]);
			const result = poly1.sub(poly2);
			expect(result.coefficients).toEqual([]);
		});
	});

	describe('scale()', () => {
		it('should scale all coefficients by factor', () => {
			const orig = new Polynomial([1, 2, 3]);
			const poly = orig.scale(2);
			expect(poly.coefficients).toEqual([2, 4, 6]);
		});

		it('should handle negative scaling', () => {
			const orig = new Polynomial([1, 2, 3]);
			const poly = orig.scale(-1);
			expect(poly.coefficients).toEqual([-1, -2, -3]);
		});

		it('should handle fractional scaling', () => {
			const orig = new Polynomial([2, 4, 6]);
			const poly = orig.scale(0.5);
			expect(poly.coefficients).toEqual([1, 2, 3]);
		});

		it('should clear polynomial when scaling by zero', () => {
			const orig = new Polynomial([1, 2, 3]);
			const poly = orig.scale(0);
			expect(poly.coefficients).toEqual([]);
			expect(poly.length).toBe(0);
		});

		it('should handle scaling empty polynomial', () => {
			const orig = new Polynomial();
			const poly = orig.scale(5);
			expect(poly.coefficients).toEqual([]);
		});
	});

	describe('geq()', () => {
		it('should return true when all coefficients are greater or equal', () => {
			const poly1 = new Polynomial([3, 4, 5]);
			const poly2 = new Polynomial([1, 2, 3]);
			expect(poly1.geq(poly2)).toBe(true);
		});

		it('should return true when coefficients are equal', () => {
			const poly1 = new Polynomial([1, 2, 3]);
			const poly2 = new Polynomial([1, 2, 3]);
			expect(poly1.geq(poly2)).toBe(true);
		});

		it('should return false when any coefficient is less', () => {
			const poly1 = new Polynomial([3, 1, 5]);
			const poly2 = new Polynomial([1, 2, 3]);
			expect(poly1.geq(poly2)).toBe(false);
		});

		it('should return false when other is longer', () => {
			const poly1 = new Polynomial([5, 6]);
			const poly2 = new Polynomial([1, 2, 3]);
			expect(poly1.geq(poly2)).toBe(false);
		});

		it('should return true when comparing with shorter polynomial', () => {
			const poly1 = new Polynomial([3, 4, 5]);
			const poly2 = new Polynomial([1, 2]);
			expect(poly1.geq(poly2)).toBe(true);
		});

		it('should return true when comparing with empty polynomial', () => {
			const poly1 = new Polynomial([1, 2, 3]);
			const poly2 = new Polynomial();
			expect(poly1.geq(poly2)).toBe(true);
		});
	});

	describe('leq()', () => {
		it('should return true when all coefficients are less or equal', () => {
			const poly1 = new Polynomial([1, 2, 3]);
			const poly2 = new Polynomial([3, 4, 5]);
			expect(poly1.leq(poly2)).toBe(true);
		});

		it('should return true when coefficients are equal', () => {
			const poly1 = new Polynomial([1, 2, 3]);
			const poly2 = new Polynomial([1, 2, 3]);
			expect(poly1.leq(poly2)).toBe(true);
		});

		it('should return false when any coefficient is greater', () => {
			const poly1 = new Polynomial([1, 5, 3]);
			const poly2 = new Polynomial([3, 4, 5]);
			expect(poly1.leq(poly2)).toBe(false);
		});

		it('should return false when this is longer with non-zero coefficients', () => {
			const poly1 = new Polynomial([1, 2, 3]);
			const poly2 = new Polynomial([5, 6]);
			expect(poly1.leq(poly2)).toBe(false);
		});

		it('should return true when comparing empty polynomial with non-empty', () => {
			const poly1 = new Polynomial();
			const poly2 = new Polynomial([1, 2, 3]);
			expect(poly1.leq(poly2)).toBe(true);
		});
	});

	describe('edge cases and normalization', () => {
		it('should handle sparse arrays correctly', () => {
			const poly = new Polynomial().with(5, 1);
			expect(poly.get(3)).toBe(0);
			expect(poly.get(5)).toBe(1);
		});

		it('should maintain normalization after multiple operations', () => {
			const poly1 = new Polynomial([1, 2, 3]);
			const poly2 = new Polynomial([0, 0, 3]);
			const result = poly1.sub(poly2).add(new Polynomial([0, 0, 3]));
			expect(result.coefficients).toEqual([1, 2, 3]);
		});

		it('should handle changes correctly', () => {
			const poly = new Polynomial([1, 2, 3]).with(2, 0).with(3, 4);
			expect(poly.coefficients).toEqual([1, 2, 0, 4]);
		});

		it('should be immutable', () => {
			const poly = new Polynomial([1, 2, 3, 4]);
			poly.with(1, 0).with(2, 1);
			poly.with(10, 10);
			poly.add(poly).sub(poly).scale(50);
			expect(poly.coefficients).toEqual([1, 2, 3, 4]);
		});
	});
});
