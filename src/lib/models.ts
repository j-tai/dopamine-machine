import { gzip, ungzip } from 'pako';

export type Edge = [number, number];
/// Immutable type representing a polynomial, where the value at index i is the coefficient for x^i. For example, [3, 0, 2] represents 3 + 0*x + 2*x^2 (which simplifies to 3 + 2x^2).
/// Invariants:
/// 1. The last coefficient must be non-zero, except for the zero polynomial which is represented by an empty array.
/// 2. Coefficients are integers in normal usage, however, we allow them to be any real number for flexibility in calculations.
/// We often use them as a list of ambiguously infinite length.
export type Polynomial = number[];

export const POLY_ZERO: Polynomial = [];
export const POLY_ONE: Polynomial = [1];

/**
 * Global Visual Constants
 */
export const COLORS = {
    BACKGROUND: '#340d0dff',
	GRID: '#602424ff',
    PLAYER: '#d81b1bff',
    CROSSHAIR: '#d81b1bff',
	PLAYER_BULLET: '#d81b1bff',
	ENEMY_COLOR_BY_RANK: ['#b563f0ff', '#6024d9ff', '#358eedff', '#3ceaf3ff'],
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
	BASIC_ENEMY_RADIUS: 30,
	// Each zone is a tall strip
	HALF_WIDTH_PER_ZONE: 2000,
	HALF_HEIGHT_FOR_PLAYER: 6000,
	HALF_HEIGHT_FOR_ENEMIES: 8000,
	PLAYER_SAFE_NO_SPAWN_RADIUS: 2000,
	MAX_ENEMIES_PER_ZONE: 1000,
	CAMERA_DRAG_RATE: 2,
	CAMERA_SOFT_THRESHOLD: 100,
	CAMERA_HARD_THRESHOLD: 300,
};

/**
 * Global Economy Constants
 */
export const ECONOMY = {
	ON_KILL_CURRENCY_SCALE: 100,
};

/// An immutable 2D vector.
/// Note arithmetic operations are named by their short forms, similar to Python conventions
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

	public rotate(radians: number): Vec2 {
		const cos = Math.cos(radians);
		const sin = Math.sin(radians);
		return new Vec2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
	}

	public dot(other: Vec2): number {
		return this.x * other.x + this.y * other.y;
	}
}

export function randomUnitVector(): Vec2 {
	const angle = Math.random() * 2 * Math.PI;
	return new Vec2(Math.cos(angle), Math.sin(angle));
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

export function inflateRect(rect: Rect, extents: Vec2 | number): Rect {
	return {
		center: rect.center,
		halfSize: rect.halfSize.add(typeof extents === "number" ? new Vec2(extents, extents) : extents),
	};
}

export function boundsContainsPoint(bounds: RectBounds, point: Vec2): boolean {
	return point.x >= bounds.min.x && point.x <= bounds.max.x && point.y >= bounds.min.y && point.y <= bounds.max.y;
}

export function clampPointToRect(point: Vec2, rect: Rect): Vec2 {
	const bounds = rectToBounds(rect);
	return new Vec2(
		Math.max(bounds.min.x, Math.min(bounds.max.x, point.x)),
		Math.max(bounds.min.y, Math.min(bounds.max.y, point.y))
	);
}

export function polyNormalizeInPlace(poly: Polynomial): void {
	// Remove trailing zeros to maintain the invariant that the last coefficient is non-zero (except for the zero polynomial)
	while (poly.length > 0 && Math.abs(poly[poly.length - 1]) < 1e-9) {
		poly.pop();
	}
}

export function polyGetAtIndex(poly: Polynomial, index: number): number {
	return index < poly.length ? poly[index] : 0;
}

export function polyElementwise(poly1: Polynomial, poly2: Polynomial, operation: (a: number, b: number) => number): Polynomial {
	const maxLength = Math.max(poly1.length, poly2.length);
	const result: Polynomial = new Array(maxLength).fill(0);
	for (let i = 0; i < maxLength; i++) {
		const coeff1 = polyGetAtIndex(poly1, i);
		const coeff2 = polyGetAtIndex(poly2, i);
		result[i] = operation(coeff1, coeff2);
	}
	polyNormalizeInPlace(result);
	return result;
}

export function polyAdd(poly1: Polynomial, poly2: Polynomial): Polynomial {
	return polyElementwise(poly1, poly2, (a, b) => a + b);
}

export function polySub(poly1: Polynomial, poly2: Polynomial): Polynomial {
	return polyElementwise(poly1, poly2, (a, b) => a - b);
}

export function polyScale(poly: Polynomial, factor: number): Polynomial {
	const result: Polynomial = poly.map(coeff => coeff * factor);
	polyNormalizeInPlace(result);
	return result;
}

export function polyOneHot(index: number, value: number): Polynomial {
	// fill all indices with 0 except the specified index which gets the given value
	const result: Polynomial = new Array(index + 1).fill(0);
	result[index] = value;
	return result;
}

/// Get the rectangle covering the specified zones.
/// Start inclusive, stop exclusive. For example, getZoneRect(0, 1) returns the rectangle covering zone 0 only, while getZoneRect(0, 2) returns the rectangle covering zones 0 and 1.
export function getZoneRect(startZone: number, stopZone: number, isPlayer: boolean): Rect {
	// Zone 0 is centered at (0, 0), zone 1 is directly to the right, etc.
	const halfWidth = PHYSICS.HALF_WIDTH_PER_ZONE * (stopZone - startZone);
	const centerX = PHYSICS.HALF_WIDTH_PER_ZONE * (startZone + stopZone - 1);
	const halfHeight = isPlayer ? PHYSICS.HALF_HEIGHT_FOR_PLAYER : PHYSICS.HALF_HEIGHT_FOR_ENEMIES;

	return {
		center: new Vec2(centerX, 0),
		halfSize: new Vec2(halfWidth, halfHeight),
	};
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
export function testLineSegmentCircleIntersection(lineStart: Vec2, lineEnd: Vec2, circleCenter: Vec2, circleRadius: number): boolean {
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

export type Bullet = {
	position: Vec2,
	velocity: Vec2,
	lifetime: number, // seconds remaining
}

/**
 * Basic enemies don't fight back.
 */
export type BasicEnemy = {
	rank: number, // 0-indexed. 0 is the weakest
	position: Vec2,
	facingDirection: Vec2,
	maxHealth: number,
	currentHealth: number,
	/// Cache visibility calculations
	isVisible?: boolean,
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

/**
 * Drags a vector toward a target position.
 *
 * @param current The current position of the object.
 * @param target The target position to drag toward.
 * @param dragFactor The factor by which to drag the object (0 = no drag, 1 = snap to target).
 * @param softThreshold The distance at which dragging starts to take effect. Closer than this threshold, the current vector is returned unchanged.
 * @param hardThreshold The resulting vector is guaranteed to be at most this many units away from the target.
 */
export function dragVectorTowards(current: Vec2, target: Vec2, dragFactor: number, softThreshold: number, hardThreshold: number): Vec2 {
	const toTarget = target.sub(current);
	const toTargetLength = toTarget.length();
	if(toTargetLength < softThreshold) {
		return current; // within soft threshold, don't apply drag
	}
	if(toTargetLength > hardThreshold) {
		return target.add(toTarget.normalize().scale(-hardThreshold)); // beyond hard threshold, clamp to hard threshold
	}
	dragFactor = Math.max(0, Math.min(1, dragFactor)); // clamp drag factor to [0, 1]
	const dragAmount = toTargetLength * dragFactor * (toTargetLength - softThreshold) / (hardThreshold - softThreshold); // scale drag amount based on distance within thresholds
	return current.add(toTarget.normalize().scale(dragAmount));
}

/// The singleton game state.
export const State = {
	/// The data that is persisted to the save file.
	save: {
		/// counter used as a heuristic to prevent overwriting a newer save
		latch: 0,
		/// how much of each currency you own
		basicRankCurrency: [] as Polynomial,
		dependencyGraph: [] as Edge[],
		obtainedUpgrades: [] as boolean[],
	},

	canvasWidthHeight: new Vec2(800, 600),
	/// The area of the world currently visible on screen, used for culling. Centered on the camera position.
	worldSpaceClip: {
		center: Vec2.ZERO,
		halfSize: new Vec2(400, 300),
	},
	cameraScale: 2, // 1 world unit = this many screen pixels
	cameraPosition: Vec2.ZERO,
	playerPosition: Vec2.ZERO,
	facingDirection: new Vec2(1, 0),
	screenMousePosition: Vec2.ZERO, // Mouse position in world scale but not shifted by camera
    mousePosition: Vec2.ZERO, // World-space mouse position
	/// Used to clamp player position
	arenaBounds: getZoneRect(0, 1, true) as Rect,
	playerBullets: [] as Bullet[],
	playerShootingCharge: 0,
	basicEnemies: [] as BasicEnemy[],
	basicEnemyInitialHealthByRank: [2, 5, 20, 100],
	basicEnemySpeedByRank: [10, 20, 35, 60],
};
type SaveDataType = typeof State.save;

export function marshalSaveToBytes(saveData: SaveDataType): Uint8Array {
    const jsonString = JSON.stringify(saveData);
    return gzip(new TextEncoder().encode(jsonString));
}

export function unmarshalSaveFromBytes(bytes: Uint8Array): SaveDataType {
    const jsonString = ungzip(bytes, { to: 'string' });
    return JSON.parse(jsonString);
}

function uint8ToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function autoSaveLoad(): void {
    const currentSave = State.save;
    const currentSaveBytes = marshalSaveToBytes(currentSave);
    const currentSaveBytesBase64 = uint8ToBase64(currentSaveBytes);
    const storedSaveBytesBase64 = localStorage.getItem('saveData');

    if (!storedSaveBytesBase64) {
        localStorage.setItem('saveData', currentSaveBytesBase64);
        return;
    }

    const loadedSaveBytes = new Uint8Array(
        atob(storedSaveBytesBase64).split("").map(c => c.charCodeAt(0))
    );
    const loadedSave = unmarshalSaveFromBytes(loadedSaveBytes);

    if (loadedSave.latch > currentSave.latch) {
        State.save = loadedSave;
    } else {
        localStorage.setItem('saveData', currentSaveBytesBase64);
    }
}

export function createBasicEnemy(rank: number): BasicEnemy {
	return {
		rank,
		position: Vec2.ZERO,
		facingDirection: new Vec2(1, 0),
		maxHealth: State.basicEnemyInitialHealthByRank[rank],
		currentHealth: State.basicEnemyInitialHealthByRank[rank],
		isVisible: false,
	};
}

/// Data that is persisted to the save file.
export type SaveData = typeof State.save;

export function onEnemyKilled(enemy: BasicEnemy) {
	// Grant currency based on enemy rank
	State.save.basicRankCurrency = polyAdd(State.save.basicRankCurrency, polyOneHot(enemy.rank, ECONOMY.ON_KILL_CURRENCY_SCALE));
}

export function updateBullet(deltaSeconds: number, bullet: Bullet): Bullet {
	const newPosition = bullet.position.add(bullet.velocity.scale(deltaSeconds));
	for(const enemy of State.basicEnemies) {
		// skip already dead enemies
		if(enemy.currentHealth <= 0) continue;
		// perform line-segment to circle intersection test to see if we hit an enemy
		if(testLineSegmentCircleIntersection(bullet.position, newPosition, enemy.position, PHYSICS.BASIC_ENEMY_RADIUS)) {
			// hit! apply damage and end the bullet's life
			enemy.currentHealth -= 1;
			bullet.lifetime = 0;
			break; // stop checking other enemies since the bullet is now dead
		}
	}
	// update fields
	bullet.position = newPosition;
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
	// Tick all enemies
	const cullingBounds = rectToBounds(inflateRect(State.worldSpaceClip, PHYSICS.BASIC_ENEMY_RADIUS * 2));
	for(const enemy of State.basicEnemies) {
		// apply velocity, reflecting off their arena bounds
		const enemyBounds = rectToBounds(getZoneRect(enemy.rank, enemy.rank + 1, false));
		const enemyVelocity = enemy.facingDirection.scale(State.basicEnemySpeedByRank[enemy.rank]);
		let newPosition = enemy.position.add(enemyVelocity.scale(deltaSeconds));
		// calculate accurate reflection if we would go out of bounds
		if(newPosition.x < enemyBounds.min.x) {
			newPosition = new Vec2(enemyBounds.min.x + (enemyBounds.min.x - newPosition.x), newPosition.y);
			enemy.facingDirection = new Vec2(-enemy.facingDirection.x, enemy.facingDirection.y);
		} else if(newPosition.x > enemyBounds.max.x) {
			newPosition = new Vec2(enemyBounds.max.x + (enemyBounds.max.x - newPosition.x), newPosition.y);
			enemy.facingDirection = new Vec2(-enemy.facingDirection.x, enemy.facingDirection.y);
		}
		if(newPosition.y < enemyBounds.min.y) {
			newPosition = new Vec2(newPosition.x, enemyBounds.min.y + (enemyBounds.min.y - newPosition.y));
			enemy.facingDirection = new Vec2(enemy.facingDirection.x, -enemy.facingDirection.y);
		} else if(newPosition.y > enemyBounds.max.y) {
			newPosition = new Vec2(newPosition.x, enemyBounds.max.y + (enemyBounds.max.y - newPosition.y));
			enemy.facingDirection = new Vec2(enemy.facingDirection.x, -enemy.facingDirection.y);
		}
		enemy.position = newPosition;
		// recalculate culling
		enemy.isVisible = boundsContainsPoint(cullingBounds, enemy.position);
	}
	// Remove dead enemies and trigger on kill effects
	State.basicEnemies = State.basicEnemies.filter(enemy => {
		if(enemy.currentHealth <= 0) {
			onEnemyKilled(enemy);
			return false;
		}
		return true;
	});
	// If any zones are not at their max population, attempt to spawn new enemies
	for(let zone = 0; zone < State.basicEnemyInitialHealthByRank.length; zone++) {
		let zoneEnemyCount = State.basicEnemies.filter(enemy => enemy.rank === zone).length;
		const zoneBounds = rectToBounds(getZoneRect(zone, zone + 1, false));
		while(zoneEnemyCount < PHYSICS.MAX_ENEMIES_PER_ZONE) {
			// Choose a random location within the zone that is outside the player's safe radius
			const randomPoint = new Vec2(
				Math.random() * (zoneBounds.max.x - zoneBounds.min.x) + zoneBounds.min.x,
				Math.random() * (zoneBounds.max.y - zoneBounds.min.y) + zoneBounds.min.y
			);
			if(randomPoint.sub(State.playerPosition).length() > PHYSICS.PLAYER_SAFE_NO_SPAWN_RADIUS) {
				const newEnemy = createBasicEnemy(zone);
				newEnemy.position = randomPoint;
				newEnemy.facingDirection = randomUnitVector();
				State.basicEnemies.push(newEnemy);
				zoneEnemyCount++;
			}
		}
	}
}

export function updateCamera(deltaSeconds: number) {
	State.cameraPosition = dragVectorTowards(State.cameraPosition, State.playerPosition, PHYSICS.CAMERA_DRAG_RATE * deltaSeconds, PHYSICS.CAMERA_SOFT_THRESHOLD, PHYSICS.CAMERA_HARD_THRESHOLD);
	State.mousePosition = State.screenMousePosition.add(State.cameraPosition);
	State.worldSpaceClip.center = State.cameraPosition;
	State.worldSpaceClip.halfSize = State.canvasWidthHeight.scale(0.5 / State.cameraScale);
}

export function updateAll(deltaSeconds: number) {
	updateCamera(deltaSeconds);
	updatePhysics(Math.min(deltaSeconds, 0.1));
	if(State.save.latch % 100 === 0) {
		autoSaveLoad();
	}
	State.save.latch += 1;
}