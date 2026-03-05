import Entity, { type RenderParams, type TickParams } from '$lib/entity';
import Vec2 from '$lib/vec2';

export default class Grid extends Entity {
	constructor() {
		super(Vec2.ZERO);
	}

	render({ ctx, camera: { visibleArea } }: RenderParams): void {
		ctx.strokeStyle = COLOR;
		ctx.lineWidth = 1;
		ctx.lineCap = 'round';

		const MARGIN = 2;
		const GRID_SPACING = 200;

		let pointer = Math.floor((visibleArea.minX - MARGIN) / GRID_SPACING) * GRID_SPACING;

		while (pointer <= visibleArea.maxX + MARGIN) {
			ctx.beginPath();
			ctx.moveTo(pointer, visibleArea.minY);
			ctx.lineTo(pointer, visibleArea.maxY);
			ctx.stroke();
			pointer += GRID_SPACING;
		}

		pointer = Math.floor((visibleArea.minY - MARGIN) / GRID_SPACING) * GRID_SPACING;

		while (pointer <= visibleArea.maxY + MARGIN) {
			ctx.beginPath();
			ctx.moveTo(visibleArea.minX, pointer);
			ctx.lineTo(visibleArea.maxX, pointer);
			ctx.stroke();
			pointer += GRID_SPACING;
		}
	}

	tick(_params: TickParams): void {}
}

const COLOR = '#602424ff';
