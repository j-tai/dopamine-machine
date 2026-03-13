import Vec2 from '$lib/vec2';
import Rect from '$lib/rect';

export default class Camera {
	scale = 2;
	targetScale = 2;
	position = Vec2.ZERO;
	targetPosition = Vec2.ZERO;
	visibleArea = Rect.fromCenterAndSize(Vec2.ZERO, Vec2.ZERO);

	tick(dt: number, canvasSize: Vec2): void {
		this.position = dragVectorTowards(
			this.position,
			this.targetPosition,
			DRAG_RATE * dt,
			SOFT_THRESHOLD,
			HARD_THRESHOLD,
		);
		this.scale += (this.targetScale - this.scale) * Math.min(1, dt * SCALE_LERP_RATE); // smooth camera zoom
		this.visibleArea = Rect.fromCenterAndSize(this.position, canvasSize.scale(1 / this.scale));
	}

	setup(ctx: CanvasRenderingContext2D): void {
		ctx.scale(this.scale, -this.scale);
		ctx.translate(-this.position.x, -this.position.y);
	}

	screenToWorldCoordinates(screenCoords: Vec2): Vec2 {
		return new Vec2(screenCoords.x, -screenCoords.y).scale(1 / this.scale).add(this.position);
	}
}

/**
 * Drags a vector toward a target position.
 *
 * @param current The current position of the object.
 * @param target The target position to drag toward.
 * @param dragFactor The factor by which to drag the object (0 = no drag, 1 = snap to target).
 * @param softThreshold The distance at which dragging starts to take effect. Closer than this threshold, the current vector is returned unchanged.
 * @param hardThreshold The resulting vector is guaranteed to be at most this many units away from the target.
 */
function dragVectorTowards(
	current: Vec2,
	target: Vec2,
	dragFactor: number,
	softThreshold: number,
	hardThreshold: number,
): Vec2 {
	const toTarget = target.sub(current);
	const toTargetLength = toTarget.length();
	if (toTargetLength < softThreshold) {
		return current; // within soft threshold, don't apply drag
	}
	if (toTargetLength > hardThreshold) {
		return target.add(toTarget.normalize().scale(-hardThreshold)); // beyond hard threshold, clamp to hard threshold
	}
	dragFactor = Math.max(0, Math.min(1, dragFactor)); // clamp drag factor to [0, 1]
	const dragAmount =
		(toTargetLength * dragFactor * (toTargetLength - softThreshold)) /
		(hardThreshold - softThreshold); // scale drag amount based on distance within thresholds
	return current.add(toTarget.normalize().scale(dragAmount));
}

const DRAG_RATE = 2;
const SOFT_THRESHOLD = 100;
const HARD_THRESHOLD = 300;
const SCALE_LERP_RATE = 0.1;
