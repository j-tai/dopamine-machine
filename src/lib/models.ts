import { gzip, ungzip } from 'pako';

export type AdjacencyMap = Map<number, number[]>;
/// Immutable type representing a polynomial, where the value at index i is the coefficient for x^i. For example, [3, 0, 2] represents 3 + 0*x + 2*x^2 (which simplifies to 3 + 2x^2).
/// Invariants:
/// 1. The last coefficient must be non-zero, except for the zero polynomial which is represented by an empty array.
/// 2. Coefficients are integers in normal usage, however, we allow them to be any real number for flexibility in calculations.
/// We often use them as a list of ambiguously infinite length.
export type Polynomial = number[];

export const POLY_ZERO: Polynomial = [];
export const POLY_ONE: Polynomial = [1];

export const UPGRADES_MAX_ADDED_EDGES = 8;

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
	BACKGROUND_UPGRADES: '#130b3fff',
	UPGRADE_COLOR: '#6b4fe9ff',
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
	 * Calculates the squared length (magnitude) of a vector defined by its x and y components.
	 *
	 * @returns The squared length of the vector, which is more efficient to compute than the actual length. Useful for comparisons where the exact length is not needed.
	 */
	public lengthSq(): number {
		return this.x * this.x + this.y * this.y;
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

export const CLEAN_UPGRADE_CACHE = {
	mainWeaponParallelShots: 1,
	playerBulletSpeedMultiplier: 1,
	playerFlySpeedMultiplier: 1,
	playerTurningSpeedMultiplier: 1,
	playerFireRateMultiplier: 1,
};

export type UpgradeCacheType = typeof CLEAN_UPGRADE_CACHE;

/// The singleton game state.
export const State = {
	/// The data that is persisted to the save file.
	save: {
		/// counter used as a heuristic to prevent overwriting a newer save
		latch: 0,
		/// how much of each currency you own
		basicRankCurrency: [] as Polynomial,
		/// backwards edges (aka all prerequisites) for each upgrade, used to determine which upgrades are available to purchase
		dependencyGraph: new Map<number, number[]>(),
		/// ids of obtained upgrades
		obtainedUpgrades: [] as number[],
	},
	upgradeCache: structuredClone(CLEAN_UPGRADE_CACHE) as UpgradeCacheType,

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
	basicEnemyInitialHealthByRank: [3, 10, 50, 500],
	basicEnemySpeedByRank: [10, 20, 35, 60],
	upgradeDefinitions: new Map<number, {
		/// Unique identifier for the upgrade, should fit in a 31-bit integer
		id: number,
		/// The name of the upgrade
		name: string,
		/// The description of the upgrade
		description: string,
		/// The cost of the upgrade
		cost: Polynomial,
		/// Function to be run when the upgrade is obtained.
		/// Should apply the upgrade's effects to the game state.
		/// It should be safe to run this function multiple times, and out of order.
		applyUpgrade: () => void,
	}>(),
	/// forward edges, minimal graph. used to generate dependencyGraph
	baseDependencyGraph: new Map<number, number[]>(),
	/// used in the UI for automatic force directed layout of upgrades. maps IDs to nodes that can wiggle around
	upgradeUINodes: new Map<number, { position: Vec2, velocity: Vec2 }>(),
	upgradeUICenter: Vec2.ZERO, // average position of all upgrade nodes, used to center UI
};
type SaveDataType = typeof State.save;

const MAP_PREFIX = '__Map__';

function replacer(_key: string, value: unknown) {
  if (value instanceof Map) {
    return { [MAP_PREFIX]: Array.from(value.entries()) };
  }
  return value;
}

function reviver(_key: string, value: unknown) {
  if (typeof value === 'object' && value !== null && MAP_PREFIX in value) {
	const record = value as Record<string, unknown>;
	const entries = record[MAP_PREFIX];
	return new Map(entries as Iterable<readonly [unknown, unknown]>);
  }
  return value;
}

export function marshalSaveToBytes(saveData: SaveDataType): Uint8Array {
  const jsonString = JSON.stringify(saveData, replacer);
  return gzip(new TextEncoder().encode(jsonString));
}

export function unmarshalSaveFromBytes(bytes: Uint8Array): SaveDataType {
  const jsonString = ungzip(bytes, { to: 'string' });
  return JSON.parse(jsonString, reviver);
}

function uint8ToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function save(): void {
    const currentSave = State.save;
    const currentSaveBytes = marshalSaveToBytes(currentSave);
    const currentSaveBytesBase64 = uint8ToBase64(currentSaveBytes);
	localStorage.setItem('saveData', currentSaveBytesBase64);
}

export function autoSaveLoad(): void {
    const currentSave = State.save;
    const storedSaveBytesBase64 = localStorage.getItem('saveData');

    if (!storedSaveBytesBase64) {
        save();
        return;
    }

    const loadedSaveBytes = new Uint8Array(
        atob(storedSaveBytesBase64).split("").map(c => c.charCodeAt(0))
    );
    const loadedSave = unmarshalSaveFromBytes(loadedSaveBytes);

    if (loadedSave.latch > currentSave.latch) {
        State.save = loadedSave;
    } else {
        save();
    }
}

export function addBaseDependency(prereqId: number, upgradeId: number): void {
	if (!State.baseDependencyGraph.has(prereqId)) {
		State.baseDependencyGraph.set(prereqId, []);
	}
	// check if it already exists
	if (State.baseDependencyGraph.get(prereqId)!.includes(upgradeId)) {
		return;
	}
	State.baseDependencyGraph.get(prereqId)!.push(upgradeId);
}

export function toRomanNumeral(num: number): string {
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];

  let result = '';
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      result += symbols[i];
      num -= values[i];
    }
  }
  return result;
}

/// Double shot is the source node for most upgrades
export const UPGRADE_ID_DOUBLE_SHOT = 2;

export function makeUpgradeParallelShots(nshots: number, title: string, cost: Polynomial): void {
	const id = nshots;
	State.upgradeDefinitions.set(id, {
		id,
		name: title,
		description: `Main weapon now shoots ${nshots} bullets in parallel.`,
		cost,
		applyUpgrade: () => {
			State.upgradeCache.mainWeaponParallelShots = Math.max(State.upgradeCache.mainWeaponParallelShots, nshots);
		},
	});
	if(nshots > 2) {
		addBaseDependency(nshots - 1, nshots);
	}
}

export function makeUpgradeBulletSpeedMultiplier(index: number): void {
	const id = 100 + index;
	const multiplier = 1 + 0.3 * (index + 1);
	const title = "Bullet Speed " + toRomanNumeral(index + 1);
	const cost = polyOneHot(index, 1500);
	State.upgradeDefinitions.set(id, {
		id,
		name: title,
		description: `Main weapon bullet speed is increased to ${multiplier * 100}%.`,
		cost,
		applyUpgrade: () => {
			State.upgradeCache.playerBulletSpeedMultiplier = Math.max(State.upgradeCache.playerBulletSpeedMultiplier, multiplier);
		},
	});
	if(index > 0) {
		addBaseDependency(id - 1, id);
	} else {
		addBaseDependency(UPGRADE_ID_DOUBLE_SHOT, id);
	}
}

export function makeUpgradeFlySpeedMultiplier(index: number): void {
	const id = 200 + index;
	const multiplier = 1 + 0.3 * (index + 1);
	const title = "Fly Speed " + toRomanNumeral(index + 1);
	const cost = polyOneHot(index, 1500);
	State.upgradeDefinitions.set(id, {
		id,
		name: title,
		description: `Player fly speed is increased to ${multiplier * 100}%.`,
		cost,
		applyUpgrade: () => {
			State.upgradeCache.playerFlySpeedMultiplier = Math.max(State.upgradeCache.playerFlySpeedMultiplier, multiplier);
		},
	});
	if(index > 0) {
		addBaseDependency(id - 1, id);
	} else {
		addBaseDependency(UPGRADE_ID_DOUBLE_SHOT, id);
	}
}

export function makeUpgradeTurningSpeedMultiplier(index: number): void {
	const id = 300 + index;
	const multiplier = 1 + 0.3 * (index + 1);
	const title = "Turning Speed " + toRomanNumeral(index + 1);
	const cost = polyOneHot(index, 1500);
	State.upgradeDefinitions.set(id, {
		id,
		name: title,
		description: `Player turning speed is increased to ${multiplier * 100}%.`,
		cost,
		applyUpgrade: () => {
			State.upgradeCache.playerTurningSpeedMultiplier = Math.max(State.upgradeCache.playerTurningSpeedMultiplier, multiplier);
		},
	});
	if(index > 0) {
		addBaseDependency(id - 1, id);
	} else {
		addBaseDependency(UPGRADE_ID_DOUBLE_SHOT, id);
	}
}

export function makeUpgradeFireRateMultiplier(index: number): void {
	const id = 400 + index;
	const multiplier = 1 + 0.1 * (index + 1);
	const title = "Fire Rate " + toRomanNumeral(index + 1);
	const cost = polyOneHot(index, 5000);
	State.upgradeDefinitions.set(id, {
		id,
		name: title,
		description: `Main weapon firing rate is increased to ${multiplier * 100}%.`,
		cost,
		applyUpgrade: () => {
			State.upgradeCache.playerFireRateMultiplier = Math.max(State.upgradeCache.playerFireRateMultiplier, multiplier);
		},
	});
	if(index > 0) {
		addBaseDependency(id - 1, id);
	} else {
		addBaseDependency(UPGRADE_ID_DOUBLE_SHOT, id);
	}
}

export function regenerateUpgradeDefinitions(): void {
	// Fix up upgradeDefinitions and baseDependencyGraph. Safe to run multiple times
	makeUpgradeParallelShots(2, "Double Shot", polyOneHot(0, 500));
	makeUpgradeParallelShots(3, "Triple Shot", polyOneHot(1, 5000));
	makeUpgradeParallelShots(4, "Quadruple Shot", polyOneHot(2, 50000));
	makeUpgradeParallelShots(5, "Quintuple Shot", polyOneHot(3, 500000));
	for(let i = 0; i < 4; i++) {
		makeUpgradeBulletSpeedMultiplier(i);
		makeUpgradeFlySpeedMultiplier(i);
		makeUpgradeTurningSpeedMultiplier(i);
		makeUpgradeFireRateMultiplier(i);
	}
	// Regenerate UI nodes, initialized to random positions
	for (const [id, def] of State.upgradeDefinitions) {
		// if node already exists, don't reset it
		if(State.upgradeUINodes.has(id)) continue;
		State.upgradeUINodes.set(id, {
			position: new Vec2(Math.random(), Math.random()),
			velocity: Vec2.ZERO,
		});
	}
}

export function regenerateDependencyGraph(firstTimeOnly: boolean): void {
	regenerateUpgradeDefinitions();
	if(firstTimeOnly && State.save.dependencyGraph.size > 0) {
		return;
	}
    // 1. Get a list of all upgrade IDs
    const allUpgradeIds = Array.from(State.upgradeDefinitions.keys());
    // 2. Shuffle the list of all upgrade IDs
    allUpgradeIds.sort(() => Math.random() - 0.5);

    // 3. Randomized Kahn's toposort
    const inDegree = new Map<number, number>();
    for (const id of allUpgradeIds) inDegree.set(id, 0);
    for (const [, deps] of State.baseDependencyGraph)
        for (const dep of deps)
            inDegree.set(dep, (inDegree.get(dep) ?? 0) + 1);

    const topoOrder: number[] = [];
    const frontier = allUpgradeIds.filter(id => inDegree.get(id) === 0);
    while (frontier.length > 0) {
        const idx = Math.floor(Math.random() * frontier.length);
        const [node] = frontier.splice(idx, 1);
        topoOrder.push(node);
        for (const neighbor of State.baseDependencyGraph.get(node) ?? []) {
            const deg = inDegree.get(neighbor)! - 1;
            inDegree.set(neighbor, deg);
            if (deg === 0) frontier.push(neighbor);
        }
    }

    // 4. Build amended graph: base edges + random new edges
    const graph = new Map<number, Set<number>>();
    for (const id of topoOrder) graph.set(id, new Set());

    for (const [prereq, dependents] of State.baseDependencyGraph)
        for (const dep of dependents)
            graph.get(prereq)!.add(dep);

    const candidates: [number, number][] = [];
    for (let i = 0; i < topoOrder.length; i++)
        for (let j = i + 1; j < topoOrder.length; j++)
            if (!graph.get(topoOrder[i])!.has(topoOrder[j]))
                candidates.push([topoOrder[i], topoOrder[j]]);
    candidates.sort(() => Math.random() - 0.5);
    for (const [u, v] of candidates.slice(0, UPGRADES_MAX_ADDED_EDGES))
        graph.get(u)!.add(v);

    // 5. Transitive reduction
    // For each edge u->v, check if v is reachable from u via another path.
    // Process in reverse topo order so intermediate edges are still present when checked.
    function canReachWithout(u: number, v: number): boolean {
        const seen = new Set<number>();
        const queue: number[] = [];
        for (const neighbor of graph.get(u)!) {
            if (neighbor !== v && !seen.has(neighbor)) {
                seen.add(neighbor);
                queue.push(neighbor);
            }
        }
        while (queue.length > 0) {
            const cur = queue.shift()!;
            if (cur === v) return true;
            for (const neighbor of graph.get(cur) ?? []) {
                if (!seen.has(neighbor)) {
                    seen.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        return false;
    }

    for (const u of [...topoOrder].reverse())
        for (const v of [...graph.get(u)!])
            if (canReachWithout(u, v))
                graph.get(u)!.delete(v);

    // 6. Invert to get dependent -> prereqs map
    const dependencyGraph = new Map<number, number[]>();
    for (const id of topoOrder) dependencyGraph.set(id, []);
    for (const [prereq, dependents] of graph)
        for (const dep of dependents)
            dependencyGraph.get(dep)!.push(prereq);

    State.save.dependencyGraph = dependencyGraph;
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
	State.facingDirection = turnUnitVectorToward(State.facingDirection, toMouse, PHYSICS.PLAYER_TURNING_RADIANS_PER_SECOND * deltaSeconds * State.upgradeCache.playerTurningSpeedMultiplier);
	// Move player forward
	const movement = State.facingDirection.scale(PHYSICS.PLAYER_MOVING_UNITS_PER_SECOND * deltaSeconds * State.upgradeCache.playerFlySpeedMultiplier);
	State.playerPosition = State.playerPosition.add(movement);
	// Clamp player to arena
	State.playerPosition = clampPointToRect(State.playerPosition, State.arenaBounds);
	// Should the player shoot?
	const modifiedSecondsPerShot = PHYSICS.PLAYER_SECONDS_PER_SHOT / State.upgradeCache.playerFireRateMultiplier;
	State.playerShootingCharge += deltaSeconds;
	while(State.playerShootingCharge >= modifiedSecondsPerShot) {
		State.playerShootingCharge -= modifiedSecondsPerShot;
		let bullet = {
			position: State.playerPosition,
			velocity: State.facingDirection.scale(PHYSICS.PLAYER_BULLET_SPEED * State.upgradeCache.playerBulletSpeedMultiplier),
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

const SPRING_LENGTH = 100;
const SPRING_STRENGTH = 0.8;
const REPULSION = 8000;
const DAMPING = 5;
const MAX_FORCE = 500;
const MAX_VELOCITY = 400;
const FIXED_DT = 1;

export function updateUpgradePhysics(_deltaSeconds: number) {
    const nodes = Array.from(State.upgradeUINodes.entries());
    if (nodes.length === 0) return;

    const forces = new Map<number, Vec2>();
    for (const [id] of nodes) {
        forces.set(id, Vec2.ZERO);
    }

    // Spring attraction along edges (both directions)
    for (const [id, node] of nodes) {
        for (const childId of State.save.dependencyGraph.get(id) ?? []) {
            const childNode = State.upgradeUINodes.get(childId);
            if (!childNode) continue;

            const delta = childNode.position.sub(node.position);
            const dist = Math.max(delta.length(), 0.01);
            const displacement = dist - SPRING_LENGTH;
            const springForce = delta.normalize().scale(SPRING_STRENGTH * displacement);

            forces.set(id, forces.get(id)!.add(springForce));
            forces.set(childId, forces.get(childId)!.sub(springForce));
        }
    }

    // Repulsion between every pair of nodes
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const [idA, nodeA] = nodes[i];
            const [idB, nodeB] = nodes[j];

            const delta = nodeB.position.sub(nodeA.position);
            const distSq = Math.max(delta.lengthSq(), 1);
            const repelForce = delta.normalize().scale(REPULSION / distSq);

            forces.set(idA, forces.get(idA)!.sub(repelForce));
            forces.set(idB, forces.get(idB)!.add(repelForce));
        }
    }

    // Clamp forces to avoid explosion from bad starting conditions
    for (const [id] of nodes) {
        const f = forces.get(id)!;
        const mag = f.length();
        if (mag > MAX_FORCE) forces.set(id, f.scale(MAX_FORCE / mag));
    }

    // Integrate using velocity stored on the node
    for (const [id, node] of nodes) {
        node.velocity = node.velocity.add(forces.get(id)!.scale(FIXED_DT));
        node.velocity = node.velocity.scale(1 / (1 + DAMPING * FIXED_DT));

        const speed = node.velocity.length();
        if (speed > MAX_VELOCITY) {
            node.velocity = node.velocity.scale(MAX_VELOCITY / speed);
        }

        node.position = node.position.add(node.velocity.scale(FIXED_DT));
    }

	// Cache average position
	State.upgradeUICenter = nodes.reduce((sum, [, node]) => sum.add(node.position), Vec2.ZERO).scale(1 / nodes.length);
}

export function updateAll(deltaSeconds: number) {
	State.cameraScale = 2 / (1 + 0.1 * State.save.obtainedUpgrades.length); // zoom out as you get more upgrades
	regenerateDependencyGraph(true);
	updateCamera(deltaSeconds);
	updatePhysics(Math.min(deltaSeconds, 0.1));
	updateUpgradePhysics(deltaSeconds);
	if(State.save.latch % 100 === 0) {
		autoSaveLoad();
	}
	State.save.latch += 1;
}