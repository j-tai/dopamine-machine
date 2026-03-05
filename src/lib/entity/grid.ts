import Entity, { type TickParams } from '$lib/entity';
import Vec2 from '$lib/vec2';
import { State } from '$lib/models';

export default class Grid extends Entity {
	constructor() {
		super(Vec2.ZERO);
	}

	render(ctx: CanvasRenderingContext2D): void {
		ctx.strokeStyle = COLOR;
		ctx.lineWidth = 1;
		ctx.lineCap = 'round';

		const MARGIN = 2;
		const GRID_SPACING = 200;
		const worldBounds = State.worldSpaceClip;

		let pointer = Math.floor((worldBounds.minX - MARGIN) / GRID_SPACING) * GRID_SPACING;

		while (pointer <= worldBounds.maxX + MARGIN) {
			ctx.beginPath();
			ctx.moveTo(pointer, worldBounds.minY);
			ctx.lineTo(pointer, worldBounds.maxY);
			ctx.stroke();
			pointer += GRID_SPACING;
		}

		pointer = Math.floor((worldBounds.minY - MARGIN) / GRID_SPACING) * GRID_SPACING;

		while (pointer <= worldBounds.maxY + MARGIN) {
			ctx.beginPath();
			ctx.moveTo(worldBounds.minX, pointer);
			ctx.lineTo(worldBounds.maxX, pointer);
			ctx.stroke();
			pointer += GRID_SPACING;
		}
	}

	tick(_params: TickParams): void {}
}

const COLOR = '#602424ff';
