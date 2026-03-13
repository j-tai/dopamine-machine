import type { Polynomial } from '$lib/models';

export class Stats {
	turningSpeedMultiplier = 1;
	flySpeedMultiplier = 1;
	fireRateMultiplier = 1;
	bulletSpeedMultiplier = 1;
	mainWeaponParallelShots = 1;
	lastUnlockedZone = 0;
}

export interface Upgrade {
	/** Unique identifier for the upgrade, should fit in a 31-bit integer */
	id: number;
	/** The name of the upgrade */
	name: string;
	/** The description of the upgrade */
	description: string;
	/** The cost of the upgrade */
	cost: Polynomial;
	/**
	 * Applies this upgrade onto the given `Stats` object.
	 * It should be safe to run this function multiple times, and out of order.
	 */
	apply(stats: Stats): void;
}
