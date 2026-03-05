import Player from '$lib/entity/player';
import type BasicEnemy from '$lib/entity/basicEnemy';
import type Bullet from '$lib/entity/bullet';
import Entity, { type RenderParams, type TickParams } from '$lib/entity';
import type { State } from '$lib/models';
import Grid from '$lib/entity/grid';
import Crosshair from '$lib/entity/crosshair';

/** Holds all entities. */
export default class World {
	grid = new Grid();
	crosshair = new Crosshair();
	player = new Player();
	enemies: BasicEnemy[] = [];
	bullets: Bullet[] = [];

	/** Deletes all dead entities. */
	prune(state: State): void {
		const deleted: Entity[] = [];
		const filterFn = (e: Entity) => {
			if (e.shouldDelete()) {
				deleted.push(e);
				return false;
			} else {
				return true;
			}
		};

		this.enemies = this.enemies.filter(filterFn);
		this.bullets = this.bullets.filter(filterFn);
		deleted.forEach((e) => e.onDelete({ world: this, state }));
	}

	getAllEntities(): Entity[] {
		return [this.grid, this.crosshair, this.player, ...this.enemies, ...this.bullets];
	}

	/** Ticks all entities. */
	tick(dt: number, state: State): void {
		const params: TickParams = {
			world: this,
			state,
			dt,
		};
		for (const e of this.getAllEntities()) {
			if (e.shouldDelete()) continue;
			e.tick(params);
		}
	}

	/** Renders all entities. */
	render(params: RenderParams): void {
		for (const e of this.getAllEntities()) {
			if (e.isVisible()) {
				params.ctx.save();
				e.render(params);
				params.ctx.restore();
			}
		}
	}
}
