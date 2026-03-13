/**
 * An immutable polynomial.
 */
export default class Polynomial {
	/** The zero polynomial: f(x) = 0. */
	static readonly ZERO = new Polynomial();
	/** The one polynomial: f(x) = 1. */
	static readonly ONE = new Polynomial([1]);

	constructor(private coeff: number[] = []) {
		// Remove trailing zero coefficients
		const lastCoefficient = this.coeff.findLastIndex((value) => value);
		this.coeff.length = lastCoefficient + 1;
	}

	/** Returns a new polynomial with one term. */
	static fromTerm(exponent: number, coefficient: number): Polynomial {
		const coeff: number[] = [];
		coeff[exponent] = coefficient;
		return new Polynomial(coeff);
	}

	/** Returns a copy of the array of coefficients. */
	get coefficients(): ReadonlyArray<number> {
		return Array.from(this.coeff, (v) => v ?? 0);
	}

	/**
	 * Returns the length of the backing array, which is equal to 1 more than
	 * the highest exponent with a non-zero coefficient.
	 */
	get length(): number {
		return this.coeff.length;
	}

	/** Returns the coefficient at the given exponent. */
	get(index: number): number {
		return this.coeff[index] ?? 0;
	}

	/** Returns a copy of this polynomial, with the coefficient at the given exponent changed. */
	with(exponent: number, value: number): Polynomial {
		// If `index` is out of bounds, this will still work; it will just add
		// empty items as needed. That's how JavaScript arrays work - they can
		// be sparse.
		const result = this.coeff.slice();
		result[exponent] = value;
		return new Polynomial(result);
	}

	private binaryOp(other: Polynomial, op: (a: number, b: number) => number): Polynomial {
		// TODO: This can be optimized to only operate on numbers that are present in the two arrays (skipping holes)
		const result: number[] = [];
		const maxLength = Math.max(this.length, other.length);
		for (let i = 0; i < maxLength; i++) {
			const value = op(this.get(i), other.get(i));
			if (value) {
				result[i] = value;
			}
		}
		return new Polynomial(result);
	}

	private unaryOp(op: (a: number) => number): Polynomial {
		const result: number[] = [];
		for (const index of this.coeff.keys()) {
			result[index] = op(this.coeff[index]);
		}
		return new Polynomial(result);
	}

	/** Adds the given polynomial to this one. */
	add(other: Polynomial): Polynomial {
		return this.binaryOp(other, (a, b) => a + b);
	}

	/** Subtracts the given polynomial from this one. */
	sub(other: Polynomial): Polynomial {
		return this.binaryOp(other, (a, b) => a - b);
	}

	/** Takes the negative of each coefficient. */
	neg(): Polynomial {
		return this.unaryOp((v) => -v);
	}

	/** Scales each coefficient by the given factor. */
	scale(factor: number): Polynomial {
		if (factor === 0) {
			return Polynomial.ZERO;
		}
		return this.unaryOp((v) => v * factor);
	}

	/**
	 * Returns true if every coefficient of this polynomial `>=` the
	 * corresponding coefficient of `other`.
	 */
	geq(other: Polynomial): boolean {
		if (other.length > this.length) return false;
		for (let i = 0; i < other.length; i++) {
			if (this.get(i) < other.get(i)) return false;
		}
		return true;
	}

	/**
	 * Returns true if every coefficient of this polynomial `<=` the
	 * corresponding coefficient of `other`.
	 */
	leq(other: Polynomial): boolean {
		return other.geq(this);
	}
}
