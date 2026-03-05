import type Vec2 from '$lib/vec2';
import type World from '$lib/world';
import type { State } from '$lib/models';

export default abstract class Entity {
	protected constructor(public position: Vec2) {}

	/** Renders the entity to the canvas. */
	abstract render(ctx: CanvasRenderingContext2D): void;

	/** Runs one physics tick. */
	abstract tick(params: TickParams): void;

	/** Returns true if the entity should be deleted. */
	shouldDelete() {
		return false;
	}

	/** Returns true if the entity is visible. */
	isVisible() {
		return true;
	}

	/** Called immediately after the entity is deleted. */
	onDelete(_params: { world: World; state: State }): void {}
}

export interface TickParams {
	/** Time delta in seconds */
	dt: number;
	/** Reference to the world object */
	world: World;
	/** Reference to the game state */
	state: State;
}
