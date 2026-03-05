/**
 * A **mutable** polynomial.
 */
export default class Polynomial {
	constructor(private coeff: number[] = []) {
		this.normalize();
	}

	static zero(): Polynomial {
		return new Polynomial([]);
	}

	static one(): Polynomial {
		return new Polynomial([1]);
	}

	/** Returns a new polynomial with one term. */
	static fromTerm(exponent: number, coefficient: number): Polynomial {
		const poly = new Polynomial();
		poly.set(exponent, coefficient);
		return poly;
	}

	/** Returns a copy of this polynomial. */
	copy(): Polynomial {
		return new Polynomial(this.coeff.slice());
	}

	/** Returns a copy of the array of coefficients. */
	get coefficients(): ReadonlyArray<number> {
		return Array.from(this.coeff, (v) => v ?? 0);
	}

	private normalize(): this {
		const lastCoefficient = this.coeff.findLastIndex((value) => value);
		this.coeff.length = lastCoefficient + 1;
		return this;
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

	/** Sets the coefficient at the given exponent. */
	set(index: number, value: number): void {
		// If `index` is out of bounds, this will still work; it will just add
		// empty items as needed. That's how JavaScript arrays work - they can
		// be sparse.
		this.coeff[index] = value;
		this.normalize();
	}

	private binaryOp(other: Polynomial, op: (a: number, b: number) => number) {
		const maxLength = Math.max(this.length, other.length);
		for (let i = 0; i < maxLength; i++) {
			this.set(i, op(this.get(i), other.get(i)));
		}
		this.normalize();
	}

	/** Adds the given polynomial to this one. */
	add(other: Polynomial): void {
		this.binaryOp(other, (a, b) => a + b);
	}

	/** Subtracts the given polynomial from this one. */
	subtract(other: Polynomial): void {
		this.binaryOp(other, (a, b) => a - b);
	}

	/** Scales each coefficient by the given factor. */
	scale(factor: number): void {
		if (factor === 0) {
			this.coeff = [];
			return;
		}
		for (const index of this.coeff.keys()) {
			this.coeff[index] *= factor;
		}
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
