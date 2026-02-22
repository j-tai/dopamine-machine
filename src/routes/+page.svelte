<script lang="ts">
    import {State, COLORS, Vec2} from "$lib/models";
    import {onMount} from "svelte";

    let canvas: HTMLCanvasElement;

    const cameraScale = 4;

    function render() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = COLORS.BACKGROUND;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set up camera (Center of screen, +Y up)
        ctx.resetTransform();
        ctx.translate(canvas.width * 0.5, canvas.height * 0.5);
        ctx.scale(cameraScale, -cameraScale);

        drawPlayer(ctx);
        drawCrosshair(ctx);
    }

    function drawCrosshair(ctx: CanvasRenderingContext2D) {
        const { x, y } = State.mousePosition;
        const size = 4; // Half-length of the crosshair lines

        ctx.save();
        ctx.translate(x, y);
        
        ctx.strokeStyle = COLORS.CROSSHAIR;
        ctx.lineWidth = 4 / cameraScale; // Keep lines thin regardless of scale
        
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

    }

    function handleMouseMove(event: MouseEvent) {
        // Convert screen space to world space
        // 1. Center origin
        let worldX = event.clientX - window.innerWidth / 2;
        let worldY = event.clientY - window.innerHeight / 2;
        
        // 2. Adjust for camera scale and inverted Y axis
        worldX /= cameraScale;
        worldY /= -cameraScale;

        State.mousePosition = new Vec2(worldX, worldY);
    }

    function runAnimationFrame() {
        render();
        requestAnimationFrame(runAnimationFrame);
    }

    onMount(() => {
        const loop = requestAnimationFrame(runAnimationFrame);
        return () => cancelAnimationFrame(loop);
    });
</script>

<svelte:window on:keydown={onKey} on:mousemove={handleMouseMove} />

<canvas bind:this={canvas}></canvas>

<style>
    canvas {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: block;
    }
</style>
