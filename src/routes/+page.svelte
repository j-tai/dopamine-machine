<script lang="ts">
    import {State, COLORS, Vec2, updateAll, PHYSICS, rectToBounds} from "$lib/models";
    import {onMount} from "svelte";

    let bottomCanvas: HTMLCanvasElement;
    let topCanvas: HTMLCanvasElement;

    let lastTime = 0;
    let splitPercent = 10;

    function resizeCanvas(canvas: HTMLCanvasElement) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    function render() {
        resizeCanvas(topCanvas);
        resizeCanvas(bottomCanvas);
        State.canvasWidthHeight = new Vec2(bottomCanvas.width, bottomCanvas.height);

        const ctx = bottomCanvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, bottomCanvas.width, bottomCanvas.height);

        // Background
        ctx.fillStyle = COLORS.BACKGROUND;
        ctx.fillRect(0, 0, bottomCanvas.width, bottomCanvas.height);

        // Set up camera (Center of screen, +Y up)
        ctx.resetTransform();
        ctx.translate(bottomCanvas.width * 0.5, bottomCanvas.height * 0.5);
        ctx.scale(State.cameraScale, -State.cameraScale);
        ctx.translate(-State.cameraPosition.x, -State.cameraPosition.y);

        drawGrid(ctx);
        drawBullets(ctx);
        drawEnemies(ctx);
        drawPlayer(ctx);
        drawCrosshair(ctx);
        ctx.resetTransform();
        drawWallet(ctx);
    }

    function drawWallet(ctx: CanvasRenderingContext2D) {
        const relativeTime = performance.now() / 1000;
        State.save.basicRankCurrency.forEach((amount, rank) => {
            const vertexRadius = 18;
            const numSides = rank + 3; // rank 0 = triangle, rank 1 = square, etc.
            const x = 40;
            const y = bottomCanvas.height - 40 - rank * 50;
            const spinRate = 3 / numSides;

            ctx.save();
            ctx.translate(x, y);

            // Draw polygon
            ctx.beginPath();
            let pointer = new Vec2(vertexRadius, 0).rotate(relativeTime * spinRate);
            const polygonAngle = (Math.PI * 2) / numSides;
            for (let i = 0; i < numSides; i++) {
                if (i === 0) ctx.moveTo(pointer.x, pointer.y);
                else ctx.lineTo(pointer.x, pointer.y);
                pointer = pointer.rotate(polygonAngle);
            }
            ctx.closePath();
            ctx.fillStyle = COLORS.ENEMY_COLOR_BY_RANK[rank];
            ctx.fill();

            // Draw amount text
            ctx.fillStyle = COLORS.ENEMY_COLOR_BY_RANK[rank];
            ctx.font = '24px monospace';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'left';
            ctx.fillText(`${amount}`, vertexRadius + 8, 0);

            ctx.restore();
        });
    }

    function drawGrid(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.strokeStyle = COLORS.GRID;
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';

        const MARGIN = 2;
        const GRID_SPACING = 200;
        const worldBounds = rectToBounds(State.worldSpaceClip);
        
        let pointer = Math.floor((worldBounds.min.x - MARGIN) / GRID_SPACING) * GRID_SPACING;

        while(pointer <= worldBounds.max.x + MARGIN) {
            ctx.beginPath();
            ctx.moveTo(pointer, worldBounds.min.y);
            ctx.lineTo(pointer, worldBounds.max.y);
            ctx.stroke();
            pointer += GRID_SPACING;
        }
        
        pointer = Math.floor((worldBounds.min.y - MARGIN) / GRID_SPACING) * GRID_SPACING;

        while(pointer <= worldBounds.max.y + MARGIN) {
            ctx.beginPath();
            ctx.moveTo(worldBounds.min.x, pointer);
            ctx.lineTo(worldBounds.max.x, pointer);
            ctx.stroke();
            pointer += GRID_SPACING;
        }

        ctx.restore();
    }

    function drawCrosshair(ctx: CanvasRenderingContext2D) {
        const { x, y } = State.mousePosition;
        const size = 4; // Half-length of the crosshair lines

        ctx.save();
        ctx.translate(x, y);
        
        ctx.strokeStyle = COLORS.CROSSHAIR;
        ctx.lineWidth = 4 / State.cameraScale; // Keep lines thin regardless of scale
        
        ctx.beginPath();
        // Horizontal line
        ctx.moveTo(-size, 0);
        ctx.lineTo(size, 0);
        // Vertical line
        ctx.moveTo(0, -size);
        ctx.lineTo(0, size);
        ctx.stroke();

        ctx.restore();
    }
                                                                                                                                                                                                                                                                                                    
    function drawBullets(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.strokeStyle = COLORS.PLAYER_BULLET;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        for (const bullet of State.playerBullets) {
            const tracerLength = 0.05 * Math.min(0.5, bullet.lifetime); // seconds of length
            const tracerDelta = bullet.velocity.scale(tracerLength);
            const tail = bullet.position.sub(tracerDelta);
            const head = bullet.position.add(tracerDelta)

            ctx.beginPath();
            ctx.moveTo(head.x, head.y);
            ctx.lineTo(tail.x, tail.y);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawEnemies(ctx: CanvasRenderingContext2D) {
        for(const enemy of State.basicEnemies) {
            if(!enemy.isVisible) {
                continue;
            }
            ctx.save();
            ctx.translate(enemy.position.x, enemy.position.y);
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = ctx.fillStyle = COLORS.ENEMY_COLOR_BY_RANK[enemy.rank];
            const polygonN = 3 + enemy.rank;
            const polygonAngle = Math.PI * 2 / polygonN;
            const vertexRadius = PHYSICS.BASIC_ENEMY_RADIUS / Math.cos(Math.PI / polygonN);
            const innerVertexRadius = vertexRadius * Math.max(0, enemy.currentHealth) / enemy.maxHealth;

            let pointer = enemy.facingDirection.scale(vertexRadius);
            ctx.beginPath();
            ctx.moveTo(pointer.x, pointer.y);
            for(let vertexIndex = 1; vertexIndex < polygonN; vertexIndex++) {
                pointer = pointer.rotate(polygonAngle);
                ctx.lineTo(pointer.x, pointer.y);
            }
            ctx.closePath();
            ctx.stroke();

            pointer = enemy.facingDirection.scale(innerVertexRadius);
            ctx.beginPath();
            ctx.moveTo(pointer.x, pointer.y);
            for(let vertexIndex = 1; vertexIndex < polygonN; vertexIndex++) {
                pointer = pointer.rotate(polygonAngle);
                ctx.lineTo(pointer.x, pointer.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    function drawPlayer(ctx: CanvasRenderingContext2D) {
        const { x, y } = State.playerPosition;
        const angle = Math.atan2(State.facingDirection.y, State.facingDirection.x);
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Draw concave arrow polygon
        // Points: Tip, Right Wing, Inner Notch, Left Wing
        ctx.beginPath();
        ctx.moveTo(10, 0);       // Tip
        ctx.lineTo(-8, 8);       // Top-back wing
        ctx.lineTo(-4, 0);       // Inner concave notch
        ctx.lineTo(-8, -8);      // Bottom-back wing
        ctx.closePath();

        ctx.fillStyle = COLORS.PLAYER;
        ctx.fill();
        
        ctx.restore();
    }

    function onKey(event: KeyboardEvent) {
        if (event.key === 'q' || event.key === 'Q') {
            splitPercent = Math.max(10, splitPercent - 10);
        }
        if (event.key === 'e' || event.key === 'E') {
            splitPercent = Math.min(90, splitPercent + 10);
        }
    }

    function handleMouseMove(event: MouseEvent) {
        const rect = bottomCanvas.getBoundingClientRect();

        // Position relative to the center of bottomCanvas
        let worldX = event.clientX - (rect.left + rect.width / 2);
        let worldY = event.clientY - (rect.top + rect.height / 2);

        // Adjust for camera scale and inverted Y axis
        worldX /= State.cameraScale;
        worldY /= -State.cameraScale;

        State.screenMousePosition = new Vec2(worldX, worldY);
    }

    function runAnimationFrame(currentTime: number) {
        // Calculate delta time in seconds (ms / 1000)
        // Initialize lastTime on the first frame to avoid a massive jump
        if (!lastTime) lastTime = currentTime;
        const dt = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        updateAll(dt);
        render();
        requestAnimationFrame(runAnimationFrame);
    }

    onMount(() => {
        const loop = requestAnimationFrame(runAnimationFrame);
        return () => cancelAnimationFrame(loop);
    });
</script>

<svelte:window on:keydown={onKey} on:mousemove={handleMouseMove} />

<div class="container">
    <canvas bind:this={topCanvas} style="height: {splitPercent}%"></canvas>
    <canvas bind:this={bottomCanvas} style="height: {100 - splitPercent}%"></canvas>
</div>

<style>
    .container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }

    canvas {
        width: 100%;
        display: block;
    }
</style>