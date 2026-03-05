import type Vec2 from '$lib/vec2';
import type World from '$lib/world';
import type { State } from '$lib/models';
import type Rect from '$lib/rect.ts';

export default abstract class Entity {
	protected constructor(public position: Vec2) {}

	/** Renders the entity to the canvas. */
	abstract render(params: RenderParams): void;

	/** Runs one physics tick. */
	abstract tick(params: TickParams): void;

	/** Returns true if the entity should be deleted. */
	shouldDelete() {
		return false;
	}

	/** Returns true if the entity should be rendered. */
	isVisible() {
		return true;
	}

	/** Called immediately after the entity is deleted. */
	onDelete(_params: { world: World; state: State }): void {}
}

export interface RenderParams {
	/** The canvas context to render to */
	ctx: CanvasRenderingContext2D;
	cameraScale: number;
	cameraPosition: Vec2;
	/** The area of the world currently visible on screen, used for culling */
	visibleArea: Rect;
}

export interface TickParams {
	/** Time delta in seconds */
	dt: number;
	/** Reference to the world object */
	world: World;
	/** Reference to the game state */
	state: State;
}
