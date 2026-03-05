import Entity, { type TickParams } from '$lib/entity';
import type Vec2 from '$lib/vec2';

export default class Bullet extends Entity {
	lifetime = LIFETIME;

	constructor(
		position: Vec2,
		public readonly velocity: Vec2,
	) {
		super(position);
	}

	tick({ dt, world }: TickParams): void {
		const newPosition = this.position.add(this.velocity.scale(dt));
		for (const enemy of world.enemies) {
			// perform a line-segment-to-circle intersection test to see if we hit an enemy
			if (
				enemy.health > 0 &&
				testLineSegmentCircleIntersection(
					this.position,
					newPosition,
					enemy.position,
					enemy.radius,
				)
			) {
				// hit! apply damage and end the bullet's life
				enemy.health -= 1;
				this.lifetime = 0;
				break; // stop checking other enemies since the bullet is now dead
			}
		}
		// update fields
		this.position = newPosition;
		this.lifetime -= dt;
	}

	render(ctx: CanvasRenderingContext2D): void {
		ctx.strokeStyle = COLOR;
		ctx.lineWidth = 2;
		ctx.lineCap = 'round';

		const tracerLength = 0.05 * Math.min(0.5, this.lifetime); // seconds of length
		const tracerDelta = this.velocity.scale(tracerLength);
		const tail = this.position.sub(tracerDelta);
		const head = this.position.add(tracerDelta);

		ctx.beginPath();
		ctx.moveTo(head.x, head.y);
		ctx.lineTo(tail.x, tail.y);
		ctx.stroke();
	}

	shouldDelete(): boolean {
		return this.lifetime <= 0;
	}
}

/**
 * Tests whether a line segment (not an infinite line!) intersects with a circle.
 *
 * @param lineStart The start point of the line segment.
 * @param lineEnd The end point of the line segment.
 * @param circleCenter The center point of the circle.
 * @param circleRadius The radius of the circle.
 * @returns True if the line segment intersects with the circle, false otherwise.
 */
function testLineSegmentCircleIntersection(
	lineStart: Vec2,
	lineEnd: Vec2,
	circleCenter: Vec2,
	circleRadius: number,
): boolean {
	const lineDir = lineEnd.sub(lineStart);
	const toCircle = circleCenter.sub(lineStart);
	const lineLength = lineDir.length();
	if (lineLength === 0) {
		// Line segment is a point, check if it's inside the circle
		return toCircle.length() <= circleRadius;
	}
	const lineUnit = lineDir.scale(1 / lineLength);
	const projectionLength = toCircle.dot(lineUnit);
	if (projectionLength < 0) {
		// Closest point is lineStart
		return toCircle.length() <= circleRadius;
	} else if (projectionLength > lineLength) {
		// Closest point is lineEnd
		return circleCenter.sub(lineEnd).length() <= circleRadius;
	}
	const closestPoint = lineStart.add(lineUnit.scale(projectionLength));
	return circleCenter.sub(closestPoint).length() <= circleRadius;
}

const LIFETIME = 1.0;
const COLOR = '#d81b1bff';
