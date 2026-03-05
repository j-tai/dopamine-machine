import Entity, { type TickParams } from '$lib/entity';
import Vec2 from '$lib/vec2';
import type World from '$lib/world';
import { polyAdd, polyOneHot, type State } from '$lib/models';
import { getZoneRect } from '$lib/zone';

export default class BasicEnemy extends Entity {
	facing = Vec2.fromAngle(Math.random() * 2 * Math.PI);
	health: number;
	readonly maxHealth: number;

	get radius() {
		return RADIUS;
	}

	constructor(
		public readonly rank: number,
		position: Vec2,
	) {
		super(position);
		this.maxHealth = MAX_HEALTH_BY_RANK[rank];
		this.health = this.maxHealth;
	}

	render(ctx: CanvasRenderingContext2D): void {
		ctx.translate(this.position.x, this.position.y);
		ctx.lineWidth = 2;
		ctx.lineCap = 'round';
		ctx.strokeStyle = ctx.fillStyle = COLOR_BY_RANK[this.rank];
		const polygonN = 3 + this.rank;
		const polygonAngle = (Math.PI * 2) / polygonN;
		const vertexRadius = this.radius / Math.cos(Math.PI / polygonN);
		const innerVertexRadius = (vertexRadius * Math.max(0, this.health)) / this.maxHealth;

		let pointer = this.facing.scale(vertexRadius);
		ctx.beginPath();
		ctx.moveTo(pointer.x, pointer.y);
		for (let vertexIndex = 1; vertexIndex < polygonN; vertexIndex++) {
			pointer = pointer.rotate(polygonAngle);
			ctx.lineTo(pointer.x, pointer.y);
		}
		ctx.closePath();
		ctx.stroke();

		pointer = this.facing.scale(innerVertexRadius);
		ctx.beginPath();
		ctx.moveTo(pointer.x, pointer.y);
		for (let vertexIndex = 1; vertexIndex < polygonN; vertexIndex++) {
			pointer = pointer.rotate(polygonAngle);
			ctx.lineTo(pointer.x, pointer.y);
		}
		ctx.closePath();
		ctx.fill();
	}

	tick({ dt }: TickParams): void {
		// apply velocity, reflecting off their arena bounds
		const enemyBounds = getZoneRect(this.rank, false);
		const enemyVelocity = this.facing.scale(SPEED_BY_RANK[this.rank]);
		let newPosition = this.position.add(enemyVelocity.scale(dt));
		// calculate accurate reflection if we would go out of bounds
		if (newPosition.x < enemyBounds.minX) {
			newPosition = new Vec2(
				enemyBounds.minX + (enemyBounds.minX - newPosition.x),
				newPosition.y,
			);
			this.facing = new Vec2(-this.facing.x, this.facing.y);
		} else if (newPosition.x > enemyBounds.maxX) {
			newPosition = new Vec2(
				enemyBounds.maxX + (enemyBounds.maxX - newPosition.x),
				newPosition.y,
			);
			this.facing = new Vec2(-this.facing.x, this.facing.y);
		}
		if (newPosition.y < enemyBounds.minY) {
			newPosition = new Vec2(
				newPosition.x,
				enemyBounds.minY + (enemyBounds.minY - newPosition.y),
			);
			this.facing = new Vec2(this.facing.x, -this.facing.y);
		} else if (newPosition.y > enemyBounds.maxY) {
			newPosition = new Vec2(
				newPosition.x,
				enemyBounds.maxY + (enemyBounds.maxY - newPosition.y),
			);
			this.facing = new Vec2(this.facing.x, -this.facing.y);
		}
		this.position = newPosition;
	}

	shouldDelete(): boolean {
		return this.health <= 0;
	}

	onDelete({ state }: { world: World; state: State }) {
		if (this.health <= 0) {
			// Grant currency based on enemy rank
			state.save.basicRankCurrency = polyAdd(
				state.save.basicRankCurrency,
				polyOneHot(this.rank, CURRENCY_SCALE),
			);
		}
	}
}

const MAX_HEALTH_BY_RANK = [3, 10, 50, 500];
const SPEED_BY_RANK = [10, 20, 35, 60];
const RADIUS = 30;
const CURRENCY_SCALE = 100;

const COLOR_BY_RANK = ['#b563f0ff', '#6024d9ff', '#358eedff', '#3ceaf3ff'];

export { COLOR_BY_RANK as ENEMY_COLOR_BY_RANK };
