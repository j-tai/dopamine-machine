<script lang="ts">
    import {
        State,
        COLORS,
        updateAll,
        PHYSICS,
        regenerateDependencyGraph,
        getAvailableUpgrades,
        selectNextAvailable,
        canAfford,
        purchaseUpgrade,
        formatCost,
    } from "$lib/models";
    import {onMount} from "svelte";
    import Vec2 from "$lib/vec2";

    let bottomCanvas: HTMLCanvasElement;
    let topCanvas: HTMLCanvasElement;

    let lastTime = 0;
    let splitPercent = 10;
    // Local UI selection mirror (keep State.selectedUpgradeId in sync)
    let selectedUpgradeId: number | null = State.selectedUpgradeId;
    // bump to force reactive recomputations when the underlying State changes outside Svelte reactivity
    let uiVersion = 0;
    function bumpUI() { uiVersion++; }

    function resizeCanvas(canvas: HTMLCanvasElement) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    function render() {
        resizeCanvas(topCanvas);
        resizeCanvas(bottomCanvas);
        State.canvasWidthHeight = new Vec2(bottomCanvas.width, bottomCanvas.height);

        renderBottom(bottomCanvas.getContext('2d')!);
        renderTop(topCanvas.getContext('2d')!);
    }

    function renderTop(ctx: CanvasRenderingContext2D) {
        if (!ctx) return;
        ctx.clearRect(0, 0, topCanvas.width, topCanvas.height);

        // Background
        ctx.fillStyle = COLORS.BACKGROUND_UPGRADES;
        ctx.fillRect(0, 0, topCanvas.width, topCanvas.height);

        drawUpgrades(ctx);
    }

    function renderBottom(ctx: CanvasRenderingContext2D) {
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

    function drawUpgrades(ctx: CanvasRenderingContext2D) {
        ctx.save();
        const nodes = Array.from(State.upgradeUINodes.entries());
        ctx.strokeStyle = COLORS.UPGRADE_COLOR;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        // center the upgrade graph
        ctx.translate(topCanvas.width * 0.5, topCanvas.height * 0.5);
        ctx.translate(-State.upgradeUICenter.x, -State.upgradeUICenter.y);

        for (const [id, node] of nodes) {
            for (const childId of State.save.dependencyGraph.get(id) ?? []) {
                const childNode = State.upgradeUINodes.get(childId)!;
                ctx.beginPath();
                ctx.moveTo(node.position.x, node.position.y);
                ctx.lineTo(childNode.position.x, childNode.position.y);
                ctx.stroke();
            }
        }

        for (const [id, node] of nodes) {
            const isObtained = State.save.obtainedUpgrades.includes(id);
            let allPrereqsSatisfied = true;
            for (const childId of State.save.dependencyGraph.get(id) ?? []) {
                allPrereqsSatisfied = allPrereqsSatisfied && State.save.obtainedUpgrades.includes(childId);
            }
            ctx.beginPath();
            ctx.arc(node.position.x, node.position.y, (isObtained ? 40 : allPrereqsSatisfied ? 20 : 10), 0, 2 * Math.PI);
            ctx.fillStyle = COLORS.UPGRADE_COLOR;
            ctx.fill();
        }

        ctx.restore();
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

        ctx.restore();
    }

    function drawCrosshair(ctx: CanvasRenderingContext2D) {
        const {x, y} = State.mousePosition;
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
        for (const enemy of State.basicEnemies) {
            if (!enemy.isVisible) {
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
            for (let vertexIndex = 1; vertexIndex < polygonN; vertexIndex++) {
                pointer = pointer.rotate(polygonAngle);
                ctx.lineTo(pointer.x, pointer.y);
            }
            ctx.closePath();
            ctx.stroke();

            pointer = enemy.facingDirection.scale(innerVertexRadius);
            ctx.beginPath();
            ctx.moveTo(pointer.x, pointer.y);
            for (let vertexIndex = 1; vertexIndex < polygonN; vertexIndex++) {
                pointer = pointer.rotate(polygonAngle);
                ctx.lineTo(pointer.x, pointer.y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    function drawPlayer(ctx: CanvasRenderingContext2D) {
        const {x, y} = State.playerPosition;
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
        // Tab: cycle selection through available upgrades (MVP behavior)
        if (event.key === 'Tab') {
            event.preventDefault();
            const next = selectNextAvailable(State.selectedUpgradeId ?? selectedUpgradeId ?? null);
            selectedUpgradeId = next;
            State.selectedUpgradeId = next;
            bumpUI();
            return;
        }

        // Purchase with 'w' or 'W'
        if (event.key === 'w' || event.key === 'W') {
            if (selectedUpgradeId != null) {
                const res = purchaseUpgrade(selectedUpgradeId);
                if (res.success) {
                    // keep selected id; it will now be in obtained list
                    bumpUI();
                } else {
                    // nothing fancy for MVP
                    bumpUI();
                }
            }
            return;
        }

        // existing split controls
        let deltaSplitPercent = 0;
        if (event.key === 'q' || event.key === 'Q') {
            deltaSplitPercent = -100;
        }
        if (event.key === 'e' || event.key === 'E') {
            deltaSplitPercent = 100;
        }
        if(event.shiftKey) {
            deltaSplitPercent *= 0.1;
        }
        splitPercent = Math.min(90, Math.max(10, splitPercent + deltaSplitPercent));
        if (event.key === '9') {
            // Debug functionality
            regenerateDependencyGraph(false);
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

        // Update physics and other objects
        updateAll(dt);
        render();
        requestAnimationFrame(runAnimationFrame);
    }

    // UI reactive values for selected upgrade
    let selectedDef: any = null;
    let isObtained = false;
    let purchasable = false;
    let costItems: { rank: number; amount: number }[] = [];

    function svgPolygonPoints(sides: number, radius = 12) {
        const pts: string[] = [];
        const startAngle = -Math.PI / 2; // point up
        for (let i = 0; i < sides; i++) {
            const a = startAngle + (i * 2 * Math.PI) / sides;
            const x = Math.cos(a) * radius;
            const y = Math.sin(a) * radius;
            pts.push(`${x},${y}`);
        }
        return pts.join(' ');
    }

    // Recompute derived UI state when selection or uiVersion changes
    $: {
        const id = selectedUpgradeId;
        const v = uiVersion; // ensure this reactive block runs when we bumpUI()
        if (id == null) {
            selectedDef = null;
            isObtained = false;
            purchasable = false;
            costItems = [];
        } else {
            selectedDef = State.upgradeDefinitions.get(id) ?? null;
            isObtained = selectedDef ? State.save.obtainedUpgrades.includes(id) : false;
            purchasable = selectedDef ? (!isObtained && canAfford(selectedDef.cost)) : false;
            costItems = selectedDef ? formatCost(selectedDef.cost) : [];
        }
    }

    onMount(() => {
        const loop = requestAnimationFrame(runAnimationFrame);
        return () => cancelAnimationFrame(loop);
    });
</script>

<svelte:window on:keydown={onKey} on:mousemove={handleMouseMove}/>

<div class="container">
    <canvas bind:this={topCanvas} style="height: {splitPercent}%"></canvas>
    <canvas bind:this={bottomCanvas}
            style="height: {100 - splitPercent}%"></canvas>
</div>

<!-- Upgrade info panel (top-right of the top panel) -->
<div class="upgrade-panel">
    {#if selectedDef}
        <div class="upgrade-title">{selectedDef.name}</div>
        <div class="upgrade-desc">{selectedDef.description}</div>
        <div class="upgrade-costs">
            {#each costItems as item}
                <div class="cost-item">
                    <svg class="poly-icon" width="28" height="28" viewBox="-16 -16 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <g transform="scale(1,-1)">
                            <polygon points={svgPolygonPoints(item.rank + 3, 12)} fill={COLORS.ENEMY_COLOR_BY_RANK[item.rank]}/>
                        </g>
                    </svg>
                    <div class="cost-amt">{item.amount}</div>
                </div>
            {/each}
        </div>
        <div class="purchase-hint" class:disabled={!purchasable || isObtained}>
            {#if isObtained}
                Already purchased
            {:else}
                Press W to purchase
            {/if}
        </div>
    {:else}
        <div class="no-selection">No upgrade selected</div>
    {/if}
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
        transition: height 0.8s cubic-bezier(0.19,1.00,0.22,1.00);
    }

    /* Upgrade panel (top-right) */
    .upgrade-panel {
        position: fixed;
        top: 12px;
        right: 12px;
        width: 320px;
        background: rgba(10, 10, 12, 0.6);
        color: #fff;
        padding: 10px;
        border-radius: 8px;
        font-family: monospace;
        pointer-events: none; /* MVP: keyboard-only for purchase */
    }

    .upgrade-title {
        font-weight: 700;
        font-size: 16px;
        margin-bottom: 6px;
    }

    .upgrade-desc {
        font-size: 12px;
        opacity: 0.9;
        margin-bottom: 8px;
    }

    .upgrade-costs { display:flex; gap:8px; align-items:center; margin-bottom:8px; }
    .cost-item { display:flex; gap:6px; align-items:center; }
    .poly-icon { display:block; }
    .cost-amt { font-size: 13px; }

    .purchase-hint { font-size: 13px; opacity: 0.95; }
    .purchase-hint.disabled { opacity: 0.45; }

    .no-selection { color: #ddd; font-size: 13px; }
</style>