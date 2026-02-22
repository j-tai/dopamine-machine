<script lang="ts">
    import {State} from "$lib/models";
    import {onMount} from "svelte";
    import { State, COLORS } from "./models";
    import { onMount } from "svelte";

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

    function runAnimationFrame() {
        render();
        requestAnimationFrame(runAnimationFrame);
    }

    onMount(runAnimationFrame);
</script>

<svelte:body on:keydown={onKey}/>

<canvas bind:this={canvas} width={1000} height={1000}></canvas>

<style>
    canvas {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
    }
</style>
