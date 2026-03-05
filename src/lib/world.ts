import Player from '$lib/entity/player';
import type BasicEnemy from '$lib/entity/basicEnemy';
import type Bullet from '$lib/entity/bullet';
import Entity, { type TickParams } from '$lib/entity';
import type { State } from '$lib/models';
import Grid from '$lib/entity/grid';
import Crosshair from '$lib/entity/crosshair';
import Camera from '$lib/camera.js';

/** Holds all entities. */
export default class World {
	grid = new Grid();
	crosshair = new Crosshair();
	player = new Player();
	enemies: BasicEnemy[] = [];
	bullets: Bullet[] = [];

	camera = new Camera();

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
		this.camera.targetPosition = this.player.position;
		this.camera.targetScale = 2 / (1 + 0.1 * state.save.obtainedUpgrades.length); // zoom out as you get more upgrades
		this.camera.tick(dt, state.canvasWidthHeight);
		state.mousePosition = this.camera.screenToWorldCoordinates(state.screenMousePosition);

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

	/** Renders the world. */
	render(ctx: CanvasRenderingContext2D): void {
		this.camera.setup(ctx);
		for (const e of this.getAllEntities()) {
			if (e.isVisible()) {
				ctx.save();
				e.render({ ctx, camera: this.camera });
				ctx.restore();
			}
		}
	}
}
