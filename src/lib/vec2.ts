/**
 * An immutable 2D vector.
 *
 * Note that arithmetic operations are named by their short forms, similar to
 * Python conventions
 */
export default class Vec2 {
	static readonly ZERO = new Vec2(0, 0);

	/**
	 * Constructs a new instance of the class with the given x and y coordinates.
	 *
	 * @param x - The x-coordinate.
	 * @param y - The y-coordinate.
	 */
	constructor(
		public readonly x: number,
		public readonly y: number,
	) {}

	/** Returns the negative of this vector. */
	neg(): Vec2 {
		return new Vec2(-this.x, -this.y);
	}

	/**
	 * Adds the components of another Vec2 object to this Vec2 object.
	 *
	 * @param other - The vector to be added.
	 * @return A new Vec2 object representing the sum of the two vectors.
	 */
	add(other: Vec2): Vec2 {
		return new Vec2(this.x + other.x, this.y + other.y);
	}

	/**
	 * Subtracts the components of the given vector from the current vector.
	 *
	 * @param other - The vector to subtract from the current vector.
	 * @return A new vector representing the result of the subtraction.
	 */
	sub(other: Vec2): Vec2 {
		return new Vec2(this.x - other.x, this.y - other.y);
	}

	/**
	 * Scales the vector by the given factor.
	 *
	 * @param factor - The factor by which to scale the vector.
	 * @return A new vector that is the result of scaling the original vector by the factor.
	 */
	scale(factor: number): Vec2 {
		return new Vec2(this.x * factor, this.y * factor);
	}

	/**
	 * Calculates the length (magnitude) of a vector defined by its x and y components.
	 *
	 * @return The length of the vector.
	 */
	length(): number {
		return Math.hypot(this.x, this.y);
	}

	/**
	 * Calculates the squared length (magnitude) of a vector defined by its x and y components.
	 *
	 * @returns The squared length of the vector, which is more efficient to compute than the actual length. Useful for comparisons where the exact length is not needed.
	 */
	lengthSq(): number {
		return this.x * this.x + this.y * this.y;
	}

	/**
	 * Normalizes the vector, scaling it to have a magnitude of 1 while maintaining its direction.
	 * If the vector's length is zero, this returns the zero vector.
	 *
	 * @return A new vector instance with a magnitude of 1 in the same direction as the original vector.
	 */
	normalize(): Vec2 {
		const len = this.length();
		if (len === 0) return Vec2.ZERO;
		return this.scale(1 / len);
	}

	/**
	 * Takes the absolute value of each component of the vector.
	 *
	 * Not to be confused with `length()`, which calculates the length of the
	 * vector.
	 */
	abs(): Vec2 {
		return new Vec2(Math.abs(this.x), Math.abs(this.y));
	}

	angle(): number {
		return Math.atan2(this.y, this.x);
	}

	static fromAngle(radians: number): Vec2 {
		return new Vec2(Math.cos(radians), Math.sin(radians));
	}

	rotate(radians: number): Vec2 {
		const cos = Math.cos(radians);
		const sin = Math.sin(radians);
		return new Vec2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
	}

	dot(other: Vec2): number {
		return this.x * other.x + this.y * other.y;
	}
}
