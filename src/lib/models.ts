export type Edge = [number, number];

/**
 * Global Visual Constants
 */
export const COLORS = {
    BACKGROUND: '#340d0dff',
    PLAYER: '#d81b1bff',
    CROSSHAIR: '#d81b1bff',
	PLAYER_BULLET: '#d81b1bff',
};

/**
 * Global Physics Constants
 */
export const PHYSICS = {
	PLAYER_TURNING_RADIANS_PER_SECOND: 6,
	PLAYER_MOVING_UNITS_PER_SECOND: 100,
	PLAYER_SECONDS_PER_SHOT: 0.5,
	PLAYER_BULLET_SPEED: 400,
	PLAYER_BULLET_LIFETIME_SECONDS: 1.0,
}

/// A 2D vector.
export class Vec2 {
	public static readonly ZERO = new Vec2(0, 0);

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

	/**
	 * Adds the components of another Vec2 object to this Vec2 object.
	 *
	 * @param other - The vector to be added.
	 * @return A new Vec2 object representing the sum of the two vectors.
	 */
	public add(other: Vec2): Vec2 {
		return new Vec2(this.x + other.x, this.y + other.y);
	}

	/**
	 * Subtracts the components of the given vector from the current vector.
	 *
	 * @param other - The vector to subtract from the current vector.
	 * @return A new vector representing the result of the subtraction.
	 */
	public sub(other: Vec2): Vec2 {
		return new Vec2(this.x - other.x, this.y - other.y);
	}

	/**
	 * Scales the vector by the given factor.
	 *
	 * @param factor - The factor by which to scale the vector.
	 * @return A new vector that is the result of scaling the original vector by the factor.
	 */
	public scale(factor: number): Vec2 {
		return new Vec2(this.x * factor, this.y * factor);
	}

	/**
	 * Calculates the length (magnitude) of a vector defined by its x and y components.
	 *
	 * @return The length of the vector.
	 */
	public length(): number {
		return Math.hypot(this.x, this.y);
	}

	/**
	 * Normalizes the vector, scaling it to have a magnitude of 1 while maintaining its direction.
	 * If the vector's length is zero, this returns the zero vector.
	 *
	 * @return A new vector instance with a magnitude of 1 in the same direction as the original vector.
	 */
	public normalize(): Vec2 {
		const len = this.length();
		if (len === 0) return Vec2.ZERO;
		return this.scale(1 / len);
	}

    public angle(): number {
        return Math.atan2(this.y, this.x);
    }

    public static fromAngle(radians: number): Vec2 {
        return new Vec2(Math.cos(radians), Math.sin(radians));
    }
}

// Center and extents
export type Rect = {
	center: Vec2,
	halfSize: Vec2,
};

export type RectBounds = {
	min: Vec2,
	max: Vec2,
};

export function rectToBounds(rect: Rect): RectBounds {
	return {
		min: rect.center.sub(rect.halfSize),
		max: rect.center.add(rect.halfSize),
	};
}

export function boundsToRect(bounds: RectBounds): Rect {
	return {
		center: bounds.min.add(bounds.max).scale(0.5),
		halfSize: bounds.max.sub(bounds.min).scale(0.5),
	};
}

export function clampPointToRect(point: Vec2, rect: Rect): Vec2 {
	const bounds = rectToBounds(rect);
	return new Vec2(
		Math.max(bounds.min.x, Math.min(bounds.max.x, point.x)),
		Math.max(bounds.min.y, Math.min(bounds.max.y, point.y))
	);
}

export type Bullet = {
	position: Vec2,
	velocity: Vec2,
	lifetime: number, // seconds remaining
}

/**
 * Smoothly rotates a unit vector towards a target direction.
 * * Guarantees:
 * 1. Returns a valid unit vector even if inputs are Zero or NaN.
 * 2. If target is invalid/zero, returns the normalized original.
 * 3. Limits rotation by max_radians, choosing the shortest arc (clockwise vs counter-clockwise).
 * 4. If the angle to target is less than max_radians, it snaps exactly to the target to prevent jitter.
 * * @param original The current direction vector.
 * @param target The desired direction vector.
 * @param max_radians Maximum rotation allowed in this step.
 */
export function turnUnitVectorToward(original: Vec2, target: Vec2, max_radians: number): Vec2 {
    const start = original.length() < 1e-9 ? new Vec2(1, 0) : original.normalize();
    const dest = target.length() < 1e-9 ? start : target.normalize();

    const startAngle = start.angle();
    const destAngle = dest.angle();

    // Find the shortest signed difference between angles (-PI to PI)
    let diff = destAngle - startAngle;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;

    // If within reach, snap to target
    if (Math.abs(diff) <= max_radians) {
        return dest;
    }

    // Otherwise, turn as much as allowed in the correct direction
    const actualTurn = Math.sign(diff) * max_radians;
    return Vec2.fromAngle(startAngle + actualTurn);
}

/// The singleton game state.
export const State = {
	/// The data that is persisted to the save file.
	save: {
		money: 0,
		dependencyGraph: [] as Edge[],
		obtainedUpgrades: [] as boolean[],
	},

	playerPosition: Vec2.ZERO,
	facingDirection: new Vec2(1, 0),
    mousePosition: Vec2.ZERO, // World-space mouse position
	arenaBounds: {
		center: Vec2.ZERO,
		halfSize: new Vec2(100, 100)
	} as Rect,
	playerBullets: [] as Bullet[],
	playerShootingCharge: 0,
};

/// Data that is persisted to the save file.
export type SaveData = typeof State.save;

export function updateBullet(deltaSeconds: number, bullet: Bullet): Bullet {
	bullet.position = bullet.position.add(bullet.velocity.scale(deltaSeconds));
	bullet.lifetime -= deltaSeconds;
	return bullet;
}

export function updatePhysics(deltaSeconds: number) {
	// Turn player toward mouse
	const toMouse = State.mousePosition.sub(State.playerPosition);
	State.facingDirection = turnUnitVectorToward(State.facingDirection, toMouse, PHYSICS.PLAYER_TURNING_RADIANS_PER_SECOND * deltaSeconds);
	// Move player forward
	const movement = State.facingDirection.scale(PHYSICS.PLAYER_MOVING_UNITS_PER_SECOND * deltaSeconds);
	State.playerPosition = State.playerPosition.add(movement);
	// Clamp player to arena
	State.playerPosition = clampPointToRect(State.playerPosition, State.arenaBounds);
	// Should the player shoot?
	State.playerShootingCharge += deltaSeconds;
	while(State.playerShootingCharge >= PHYSICS.PLAYER_SECONDS_PER_SHOT) {
		State.playerShootingCharge -= PHYSICS.PLAYER_SECONDS_PER_SHOT;
		let bullet = {
			position: State.playerPosition,
			velocity: State.facingDirection.scale(PHYSICS.PLAYER_BULLET_SPEED),
			lifetime: PHYSICS.PLAYER_BULLET_LIFETIME_SECONDS,
		};
		State.playerBullets.push(bullet);
		// apply excess time immediately
		bullet = updateBullet(State.playerShootingCharge, bullet);
	}
	// Update bullets and remove expired ones
	State.playerBullets = State.playerBullets
		.map(bullet => updateBullet(deltaSeconds, bullet))
		.filter(bullet => bullet.lifetime > 0);
}

export function updateAll(deltaSeconds: number) {
	updatePhysics(Math.min(deltaSeconds, 0.1));
}