<script lang="ts">
    import {State} from "$lib/models";
    import {onMount} from "svelte";

    let canvas: HTMLCanvasElement;

    const cameraScale = 4;

    function render() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set up camera
        ctx.resetTransform();
        ctx.translate(canvas.width*0.5, canvas.height*0.5);
        ctx.scale(cameraScale, -cameraScale);

        ctx.fillStyle = 'red';
        ctx.ellipse(State.playerPosition.x, State.playerPosition.y, 10, 10, 0, 0, 2 * Math.PI);

        ctx.fill();
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
