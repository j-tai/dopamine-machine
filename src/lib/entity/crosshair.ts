import Entity, { type TickParams } from '$lib/entity';
import Vec2 from '$lib/vec2';
import { State } from '$lib/models';

export default class Crosshair extends Entity {
	constructor() {
		super(Vec2.ZERO);
	}

	render(ctx: CanvasRenderingContext2D): void {
		ctx.translate(this.position.x, this.position.y);
		ctx.strokeStyle = COLOR;
		ctx.lineWidth = 4 / State.cameraScale; // Keep lines thin regardless of scale

		ctx.beginPath();
		// Horizontal line
		ctx.moveTo(-SIZE, 0);
		ctx.lineTo(SIZE, 0);
		// Vertical line
		ctx.moveTo(0, -SIZE);
		ctx.lineTo(0, SIZE);
		ctx.stroke();
	}

	tick(params: TickParams): void {
		this.position = params.state.mousePosition;
	}
}

const COLOR = '#d81b1bff';
const SIZE = 4; // Half-length of the crosshair lines
