import Entity, { type RenderParams, type TickParams } from '$lib/entity';
import Vec2 from '$lib/vec2';
import Rect from '$lib/rect';
import { getZoneRect } from '$lib/zone';
import Bullet from '$lib/entity/bullet';
import { Stats } from '$lib/upgrades';

export default class Player extends Entity {
	facing = new Vec2(1, 0);
	shootingCharge = 0;

	stats = new Stats();

	constructor() {
		super(Vec2.ZERO);
	}

	render({ ctx }: RenderParams): void {
		ctx.translate(this.position.x, this.position.y);
		ctx.rotate(this.facing.angle());

		// Draw concave arrow polygon
		// Points: Tip, Right Wing, Inner Notch, Left Wing
		ctx.beginPath();
		ctx.moveTo(10, 0); // Tip
		ctx.lineTo(-8, 8); // Top-back wing
		ctx.lineTo(-4, 0); // Inner concave notch
		ctx.lineTo(-8, -8); // Bottom-back wing
		ctx.closePath();

		ctx.fillStyle = COLOR;
		ctx.fill();
	}

	tick({ dt, state, world }: TickParams): void {
		// Turn the player toward the mouse
		const toMouse = state.mousePosition.sub(this.position);
		this.facing = turnUnitVectorToward(
			this.facing,
			toMouse,
			TURNING_RADIANS_PER_SECOND * dt * this.stats.turningSpeedMultiplier,
		);

		// Move player forward
		const movement = this.facing.scale(
			MOVING_UNITS_PER_SECOND * dt * this.stats.flySpeedMultiplier,
		);
		this.position = this.position.add(movement);

		// Clamp player to arena
		this.position = Rect.bounding(
			getZoneRect(0, true),
			getZoneRect(this.stats.lastUnlockedZone, true),
		).clamp(this.position);

		// Should the player shoot?
		const chargeRequired = SECONDS_PER_SHOT / this.stats.fireRateMultiplier;
		this.shootingCharge += dt;
		const forwardParallelShotPositions = parallelShotPositions(
			this.position,
			this.facing,
			this.stats.mainWeaponParallelShots,
		);
		while (this.shootingCharge >= chargeRequired) {
			this.shootingCharge -= chargeRequired;
			forwardParallelShotPositions.forEach((shotPos) => {
				const velocity = this.facing.scale(BULLET_SPEED * this.stats.bulletSpeedMultiplier);
				world.bullets.push(new Bullet(shotPos.add(velocity.scale(0.03)), velocity));
			});
		}
	}
}

/**
 * Smoothly rotates a unit vector towards a target direction.
 *
 * Guarantees:
 * 1. Returns a valid unit vector even if inputs are Zero or NaN.
 * 2. If target is invalid/zero, returns the normalized original.
 * 3. Limits rotation by maxRadians, choosing the shortest arc (clockwise vs counter-clockwise).
 * 4. If the angle to target is less than maxRadians, it snaps exactly to the target to prevent jitter.
 * @param original The current direction vector.
 * @param target The desired direction vector.
 * @param maxRadians Maximum rotation allowed in this step.
 */
function turnUnitVectorToward(original: Vec2, target: Vec2, maxRadians: number): Vec2 {
	const start = original.length() < 1e-9 ? new Vec2(1, 0) : original.normalize();
	const dest = target.length() < 1e-9 ? start : target.normalize();

	const startAngle = start.angle();
	const destAngle = dest.angle();

	// Find the shortest signed difference between angles (-PI to PI)
	let diff = destAngle - startAngle;
	while (diff > Math.PI) diff -= 2 * Math.PI;
	while (diff < -Math.PI) diff += 2 * Math.PI;

	// If within reach, snap to target
	if (Math.abs(diff) <= maxRadians) {
		return dest;
	}

	// Otherwise, turn as much as allowed in the correct direction
	const actualTurn = Math.sign(diff) * maxRadians;
	return Vec2.fromAngle(startAngle + actualTurn);
}

function parallelShotPositions(
	startPosition: Vec2,
	facingDirection: Vec2,
	numShots: number,
): Vec2[] {
	const shotPositions: Vec2[] = [];
	const spreadUnit = facingDirection.rotate90deg().scale(8 / numShots);

	for (let i = 0; i < numShots; i++) {
		shotPositions.push(startPosition.add(spreadUnit.scale(numShots - 1 - 2 * i)));
	}
	return shotPositions;
}

const TURNING_RADIANS_PER_SECOND = 6;
const MOVING_UNITS_PER_SECOND = 100;
const SECONDS_PER_SHOT = 0.5;
const BULLET_SPEED = 400;
const COLOR = '#d81b1bff';
