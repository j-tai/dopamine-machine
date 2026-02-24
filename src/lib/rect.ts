import Vec2 from '$lib/vec2.js';

/** An immutable, axis-aligned rectangle in 2D space. */
export default class Rect {
	constructor(
		public readonly minX: number,
		public readonly maxX: number,
		public readonly minY: number,
		public readonly maxY: number,
	) {}

	// Getters

	/** The minimum X and Y coordinates of the rectangle. */
	get min(): Vec2 {
		return new Vec2(this.minX, this.minY);
	}

	/** The maximum X and Y coordinates of the rectangle. */
	get max(): Vec2 {
		return new Vec2(this.maxX, this.maxY);
	}

	/** The center point of the rectangle. */
	get center(): Vec2 {
		return new Vec2((this.minX + this.maxX) / 2, (this.minY + this.maxY) / 2);
	}

	/** The rectangle's width and height. */
	get size(): Vec2 {
		return new Vec2(this.maxX - this.minX, this.maxY - this.minY);
	}

	// Constructors

	/** Creates a rectangle from any two opposing corners. */
	static fromCorners(first: Vec2, second: Vec2): Rect {
		return new Rect(
			Math.min(first.x, second.x),
			Math.max(first.x, second.x),
			Math.min(first.y, second.y),
			Math.max(first.y, second.y),
		);
	}

	/** Creates a rectangle given its center point and its size. */
	static fromCenterAndSize(center: Vec2, size: Vec2): Rect {
		const halfSize = size.scale(0.5).abs();
		return new Rect(
			center.x - halfSize.x,
			center.x + halfSize.x,
			center.y - halfSize.y,
			center.y + halfSize.y,
		);
	}

	/** Creates a rectangle given its top-left point and its size. */
	static fromCornerAndSize(corner: Vec2, size: Vec2): Rect {
		return Rect.fromCorners(corner, corner.add(size));
	}

	/** Returns the smallest rectangle that encloses both given rectangles. */
	static bounding(first: Rect, second: Rect): Rect {
		return new Rect(
			Math.min(first.minX, second.minX),
			Math.max(first.maxX, second.maxX),
			Math.min(first.minY, second.minY),
			Math.max(first.maxY, second.maxY),
		);
	}

	// Operations

	/** Returns true if the point is inside the rectangle, or on its boundary. */
	contains(point: Vec2): boolean {
		return (
			point.x >= this.minX &&
			point.x <= this.maxX &&
			point.y >= this.minY &&
			point.y <= this.maxY
		);
	}

	/** Returns the closest point inside the rectangle to the given point. */
	clamp(point: Vec2): Vec2 {
		if (this.contains(point)) return point;
		return new Vec2(
			Math.max(this.minX, Math.min(this.maxX, point.x)),
			Math.max(this.minY, Math.min(this.maxY, point.y)),
		);
	}

	/** Creates a new rectangle with the same center but a new size. */
	withSize(size: Vec2): Rect {
		return Rect.fromCenterAndSize(this.center, size);
	}

	/**
	 * Increases the size of the rectangle by the given amount in each direction.
	 *
	 * The rectangle's new size will be increased by `amount * 2`.
	 */
	grow(amount: Vec2 | number): Rect {
		if (typeof amount === 'number') {
			amount = new Vec2(amount, amount);
		}
		return this.withSize(this.size.add(amount));
	}
}
