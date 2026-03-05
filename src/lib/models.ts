import { gzip, ungzip } from 'pako';
import Vec2 from '$lib/vec2';
import World from '$lib/world';
import { Stats, type Upgrade } from '$lib/upgrades';
import { getZoneRect, NUM_ZONES } from '$lib/zone';
import BasicEnemy from '$lib/entity/basicEnemy';
import Polynomial from '$lib/polynomial';

export type AdjacencyMap = Map<number, number[]>;

export const UPGRADES_MAX_ADDED_EDGES = 20;

/**
 * Global Visual Constants
 */
export const COLORS = {
	BACKGROUND: '#340d0dff',
	BACKGROUND_UPGRADES: '#130b3fff',
	UPGRADE_COLOR: '#6b4fe9ff',
};

/**
 * Global Physics Constants
 */
export const PHYSICS = {
	// Each zone is a tall strip
	PLAYER_SAFE_NO_SPAWN_RADIUS: 2000,
	MAX_ENEMIES_PER_ZONE: 1000,
};

// --- Upgrade / purchase utility helpers ---

/** Get the upgrade definition for an id, or undefined if missing. */
export function getUpgradeDef(id: number) {
	return State.upgradeDefinitions.get(id);
}

/** Returns true if all prereqs for this upgrade id are satisfied (or there are none). */
export function isPrereqsSatisfied(id: number): boolean {
	const prereqs = State.save.dependencyGraph.get(id) ?? [];
	return prereqs.every((p) => State.save.obtainedUpgrades.includes(p));
}

/** Returns list of upgrade ids that are not yet obtained and have all prereqs satisfied, in ascending integer order. */
export function getAvailableUpgrades(): number[] {
	const ids = Array.from(State.upgradeDefinitions.keys()).sort((a, b) => a - b);
	return ids.filter((id) => !State.save.obtainedUpgrades.includes(id) && isPrereqsSatisfied(id));
}

/** Select the next available upgrade in integer order, wrapping. Returns null if none available. */
export function selectNextAvailable(currentId?: number | null): number | null {
	const list = getAvailableUpgrades();
	if (list.length === 0) return null;
	if (currentId == null) return list[0];
	const idx = list.indexOf(currentId);
	if (idx === -1) return list[0];
	return list[(idx + 1) % list.length];
}

/** Returns true if the provided polynomial cost can be paid by State.save.basicRankCurrency. */
export function canAfford(cost: Polynomial): boolean {
	return State.save.basicRankCurrency.geq(cost);
}

/** Subtracts `cost` from State.save.basicRankCurrency. Assumes caller checked canAfford. */
export function applyCost(cost: Polynomial): void {
	// Work on a copy so we can re-normalize and assign back
	State.save.basicRankCurrency.subtract(cost);
}

/** Attempt to purchase an upgrade by id. Returns success boolean and optional reason. */
export function purchaseUpgrade(id: number): { success: boolean; reason?: string } {
	if (State.save.obtainedUpgrades.includes(id))
		return { success: false, reason: 'already_obtained' };
	if (!isPrereqsSatisfied(id)) return { success: false, reason: 'prereqs_not_satisfied' };
	const def = getUpgradeDef(id);
	if (!def) return { success: false, reason: 'not_found' };
	if (!canAfford(def.cost)) return { success: false, reason: 'insufficient_funds' };
	applyCost(def.cost);
	State.save.obtainedUpgrades.push(id);
	def.apply(State.world.player.stats);
	return { success: true };
}

/** Convert a polynomial cost into an array of {rank, amount} entries (skips zero entries). */
export function formatCost(cost: Polynomial): { rank: number; amount: number }[] {
	const out: { rank: number; amount: number }[] = [];
	for (let i = 0; i < cost.length; i++) {
		const amt = cost.get(i);
		if (amt > 0) out.push({ rank: i, amount: amt });
	}
	return out;
}

/** The singleton game state. */
export const State = {
	/** The data that is persisted to the save file. */
	save: {
		/** counter used as a heuristic to prevent overwriting a newer save */
		latch: 0,
		/** how much of each currency you own */
		basicRankCurrency: Polynomial.zero(),
		/** backwards edges (aka all prerequisites) for each upgrade, used to determine which upgrades are available to purchase */
		dependencyGraph: new Map<number, number[]>(),
		/** ids of obtained upgrades */
		obtainedUpgrades: [] as number[],
	},

	world: new World(),

	// UI selection state (MVP): currently selected upgrade id in UI, or null
	selectedUpgradeId: null as number | null,

	canvasWidthHeight: new Vec2(800, 600),
	screenMousePosition: Vec2.ZERO, // Mouse position in world scale but not shifted by camera
	mousePosition: Vec2.ZERO, // World-space mouse position
	upgradeDefinitions: new Map<number, Upgrade>(),
	/** forward edges, minimal graph. used to generate dependencyGraph */
	baseDependencyGraph: new Map<number, number[]>(),
	/** used in the UI for automatic force directed layout of upgrades. maps IDs to nodes that can wiggle around */
	upgradeUINodes: new Map<number, { position: Vec2; velocity: Vec2 }>(),
	upgradeUICenter: Vec2.ZERO, // average position of all upgrade nodes, used to center UI
};
export type State = typeof State;
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
		atob(storedSaveBytesBase64)
			.split('')
			.map((c) => c.charCodeAt(0)),
	);
	const loadedSave = unmarshalSaveFromBytes(loadedSaveBytes);

	if (loadedSave.latch > currentSave.latch) {
		State.save = loadedSave;
		reapplyAllUpgrades();
	} else {
		save();
	}
}

export function reapplyAllUpgrades(): void {
	const newStats = new Stats();
	State.save.obtainedUpgrades.forEach((id) => {
		const def = getUpgradeDef(id);
		def?.apply(newStats);
	});
	State.world.player.stats = newStats;
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

export function formatPercent(multiplier: number): string {
	return `${Math.round(multiplier * 100)}%`;
}

/// Double shot is the source node for most upgrades
export const UPGRADE_ID_DOUBLE_SHOT = 2;

export function autoDependencies(upgradeId: number, cost: Polynomial): void {
	// It is possible to farm squares (rank 1) without actually unlocking zone 1, by sitting on the border
	// But it would not be possible to farm pentagons (rank 2) without unlocking zone 1 first
	if (cost.length > 2) {
		// Need to unlock zone to possibly farm that currency
		addBaseDependency(500 + (cost.length - 2), upgradeId);
	}
}

export function makeUpgradeParallelShots(nshots: number, title: string, cost: Polynomial): void {
	const id = nshots;
	State.upgradeDefinitions.set(id, {
		id,
		name: title,
		description: `Main weapon now shoots ${nshots} bullets in parallel.`,
		cost,
		apply(stats) {
			stats.mainWeaponParallelShots = Math.max(stats.mainWeaponParallelShots, nshots);
		},
	});
	if (nshots > 2) {
		addBaseDependency(nshots - 1, nshots);
	}
	autoDependencies(id, cost);
}

export function makeUpgradeBulletSpeedMultiplier(index: number): void {
	const id = 100 + index;
	const multiplier = 1 + 0.3 * (index + 1);
	const title = 'Bullet Speed ' + toRomanNumeral(index + 1);
	const cost = Polynomial.fromTerm(index, 1500);
	State.upgradeDefinitions.set(id, {
		id,
		name: title,
		description: `Main weapon bullet speed is increased to ${formatPercent(multiplier)}.`,
		cost,
		apply(stats) {
			stats.bulletSpeedMultiplier = Math.max(stats.bulletSpeedMultiplier, multiplier);
		},
	});
	if (index > 0) {
		addBaseDependency(id - 1, id);
	} else {
		addBaseDependency(UPGRADE_ID_DOUBLE_SHOT, id);
	}
	autoDependencies(id, cost);
}

export function makeUpgradeFlySpeedMultiplier(index: number): void {
	const id = 200 + index;
	const multiplier = 1 + 0.3 * (index + 1);
	const title = 'Fly Speed ' + toRomanNumeral(index + 1);
	const cost = Polynomial.fromTerm(index, 1500);
	State.upgradeDefinitions.set(id, {
		id,
		name: title,
		description: `Player fly speed is increased to ${formatPercent(multiplier)}.`,
		cost,
		apply(stats) {
			stats.flySpeedMultiplier = Math.max(stats.flySpeedMultiplier, multiplier);
		},
	});
	if (index > 0) {
		addBaseDependency(id - 1, id);
	} else {
		addBaseDependency(UPGRADE_ID_DOUBLE_SHOT, id);
	}
	autoDependencies(id, cost);
}

export function makeUpgradeTurningSpeedMultiplier(index: number): void {
	const id = 300 + index;
	const multiplier = 1 + 0.3 * (index + 1);
	const title = 'Turning Speed ' + toRomanNumeral(index + 1);
	const cost = Polynomial.fromTerm(index, 1500);
	State.upgradeDefinitions.set(id, {
		id,
		name: title,
		description: `Player turning speed is increased to ${formatPercent(multiplier)}.`,
		cost,
		apply(stats) {
			stats.turningSpeedMultiplier = Math.max(stats.turningSpeedMultiplier, multiplier);
		},
	});
	if (index > 0) {
		addBaseDependency(id - 1, id);
	} else {
		addBaseDependency(UPGRADE_ID_DOUBLE_SHOT, id);
	}
	autoDependencies(id, cost);
}

export function makeUpgradeFireRateMultiplier(index: number): void {
	const id = 400 + index;
	const multiplier = 1 + 0.1 * (index + 1);
	const title = 'Fire Rate ' + toRomanNumeral(index + 1);
	const cost = Polynomial.fromTerm(index, 5000);
	State.upgradeDefinitions.set(id, {
		id,
		name: title,
		description: `Main weapon firing rate is increased to ${formatPercent(multiplier)}.`,
		cost,
		apply(stats) {
			stats.fireRateMultiplier = Math.max(stats.fireRateMultiplier, multiplier);
		},
	});
	if (index > 0) {
		addBaseDependency(id - 1, id);
	} else {
		addBaseDependency(UPGRADE_ID_DOUBLE_SHOT, id);
	}
	autoDependencies(id, cost);
}

export function makeUpgradeLastUnlockedZone(index: number): void {
	const id = 500 + index;
	const title = 'Unlock Zone ' + toRomanNumeral(index + 1);
	const cost = Polynomial.fromTerm(index, 1000);
	State.upgradeDefinitions.set(id, {
		id,
		name: title,
		description: `Unlocks zone ${index + 1}.`,
		cost,
		apply(stats) {
			stats.lastUnlockedZone = Math.max(stats.lastUnlockedZone, index);
		},
	});
	if (index > 1) {
		addBaseDependency(id - 1, id);
	} else {
		addBaseDependency(UPGRADE_ID_DOUBLE_SHOT, id);
	}
	// redundant here
	// autoDependencies(id, cost);
}

export function regenerateUpgradeDefinitions(): void {
	// Fix up upgradeDefinitions and baseDependencyGraph. Safe to run multiple times
	makeUpgradeParallelShots(2, 'Double Shot', Polynomial.fromTerm(0, 500));
	makeUpgradeParallelShots(3, 'Triple Shot', Polynomial.fromTerm(1, 5000));
	makeUpgradeParallelShots(4, 'Quadruple Shot', Polynomial.fromTerm(2, 50000));
	makeUpgradeParallelShots(5, 'Quintuple Shot', Polynomial.fromTerm(3, 500000));
	for (let i = 0; i < 4; i++) {
		makeUpgradeBulletSpeedMultiplier(i);
		makeUpgradeFlySpeedMultiplier(i);
		makeUpgradeTurningSpeedMultiplier(i);
		makeUpgradeFireRateMultiplier(i);
		if (i == 0) {
			continue;
		}
		makeUpgradeLastUnlockedZone(i);
	}
	// Regenerate UI nodes, initialized to random positions
	for (const [id] of State.upgradeDefinitions) {
		// if node already exists, don't reset it
		if (State.upgradeUINodes.has(id)) continue;
		State.upgradeUINodes.set(id, {
			position: new Vec2(Math.random(), Math.random()),
			velocity: Vec2.ZERO,
		});
	}
}

export function regenerateDependencyGraph(firstTimeOnly: boolean): void {
	regenerateUpgradeDefinitions();
	if (firstTimeOnly && State.save.dependencyGraph.size > 0) {
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
		for (const dep of deps) inDegree.set(dep, (inDegree.get(dep) ?? 0) + 1);

	const topoOrder: number[] = [];
	const frontier = allUpgradeIds.filter((id) => inDegree.get(id) === 0);
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
		for (const dep of dependents) graph.get(prereq)!.add(dep);

	const candidates: [number, number][] = [];
	for (let i = 0; i < topoOrder.length; i++) {
		// Chain-like algorithm biased to nearby nodes
		let j = i + 1;
		if (j < topoOrder.length) {
			candidates.push([topoOrder[i], topoOrder[j]]);
		}
		j += 1 + Math.floor(Math.random() * 3);
		if (j < topoOrder.length) {
			candidates.push([topoOrder[i], topoOrder[j]]);
		}
	}
	candidates.sort(() => Math.random() - 0.5);
	for (const [u, v] of candidates.slice(0, UPGRADES_MAX_ADDED_EDGES)) graph.get(u)!.add(v);

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
		for (const v of [...graph.get(u)!]) if (canReachWithout(u, v)) graph.get(u)!.delete(v);

	// 6. Invert to get dependent -> prereqs map
	const dependencyGraph = new Map<number, number[]>();
	for (const id of topoOrder) dependencyGraph.set(id, []);
	for (const [prereq, dependents] of graph)
		for (const dep of dependents) dependencyGraph.get(dep)!.push(prereq);

	State.save.dependencyGraph = dependencyGraph;
}

export function updatePhysics(delta: number) {
	State.world.tick(delta, State);
	State.world.prune(State);

	// If any zones are not at their max population, attempt to spawn new enemies
	for (let zone = 0; zone < NUM_ZONES; zone++) {
		let zoneEnemyCount = State.world.enemies.filter((enemy) => enemy.rank === zone).length;
		const zoneBounds = getZoneRect(zone, false);
		while (zoneEnemyCount < PHYSICS.MAX_ENEMIES_PER_ZONE) {
			// Choose a random location within the zone that is outside the player's safe radius
			const randomPoint = new Vec2(
				zoneBounds.minX + Math.random() * zoneBounds.size.x,
				zoneBounds.minY + Math.random() * zoneBounds.size.y,
			);
			if (
				randomPoint.sub(State.world.player.position).length() >
				PHYSICS.PLAYER_SAFE_NO_SPAWN_RADIUS
			) {
				State.world.enemies.push(new BasicEnemy(zone, randomPoint));
				zoneEnemyCount++;
			}
		}
	}
}

const SPRING_LENGTH = 100;
const SPRING_STRENGTH = 0.8;
const REPULSION = 8000;
const DAMPING = 5;
const MAX_FORCE = 500;
const MAX_VELOCITY = 400;
const FIXED_DT = 1;

export function updateUpgradePhysicsTick(deltaSeconds: number) {
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
		node.velocity = node.velocity.add(forces.get(id)!.scale(deltaSeconds));
		node.velocity = node.velocity.scale(1 / (1 + DAMPING * deltaSeconds));

		const speed = node.velocity.length();
		if (speed > MAX_VELOCITY) {
			node.velocity = node.velocity.scale(MAX_VELOCITY / speed);
		}

		node.position = node.position.add(node.velocity.scale(deltaSeconds));
	}

	// Cache average position
	State.upgradeUICenter = nodes
		.reduce((sum, [, node]) => sum.add(node.position), Vec2.ZERO)
		.scale(1 / nodes.length);
}

export function updateUpgradePhysics(_deltaSeconds: number) {
	const NUM_ITERATIONS = 10;
	for (let i = 0; i < NUM_ITERATIONS; i++) {
		updateUpgradePhysicsTick(FIXED_DT);
	}
}

export function updateAll(dt: number) {
	dt = Math.min(1.0, Math.max(1e-9, dt)); // clamp to a sane but permissive range
	regenerateDependencyGraph(true);
	updatePhysics(Math.min(dt, 0.1));
	updateUpgradePhysics(dt);
	if (State.save.latch % 100 === 0) {
		autoSaveLoad();
	}
	State.save.latch += 1;
}
