// ===================================
// GLOBAL VARIABLES
// ===================================

let canvas, ctx;
let gridSize = 20;
let cellSize = 25;
let grid = [];
let startPos = null;
let destinationPos = null;
let agv = null;
let currentPath = [];
let exploredNodes = [];
let drawMode = 'obstacle';
let isSimulationRunning = false;
let animationSpeed = 200;
let animationFrameId = null;
let rerouteCount = 0;
let obstacles = [];
let isDemoMode = false;
let autoObstacleMode = false;
let autoObstacleInterval = null;

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initializeCanvas();
    initializeGrid();
    initializeControls();
    initializeDrawing();

    // Start automated demo after 1 second
    setTimeout(() => {
        startAutomatedDemo();
    }, 1000);
});

function initializeCanvas() {
    canvas = document.getElementById('gridCanvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = container.clientWidth - 48;
    const maxHeight = Math.max(600, window.innerHeight - 300);

    const size = Math.min(maxWidth, maxHeight);
    cellSize = Math.floor(size / gridSize);

    canvas.width = cellSize * gridSize;
    canvas.height = cellSize * gridSize;

    drawGrid();
}

function initializeGrid() {
    grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill('empty'));
    obstacles = [];
}

// ===================================
// CONTROLS
// ===================================

function initializeControls() {
    // Grid size slider
    const gridSizeSlider = document.getElementById('gridSize');
    const gridSizeValue = document.getElementById('gridSizeValue');

    gridSizeSlider.addEventListener('input', (e) => {
        gridSize = parseInt(e.target.value);
        gridSizeValue.textContent = `${gridSize}x${gridSize}`;
        resetSimulation();
    });

    // Animation speed slider
    const animSpeedSlider = document.getElementById('animSpeed');
    const animSpeedValue = document.getElementById('animSpeedValue');

    animSpeedSlider.addEventListener('input', (e) => {
        animationSpeed = parseInt(e.target.value);
        animSpeedValue.textContent = `${animationSpeed}ms`;
        if (agv) {
            agv.setSpeed(1 / (animationSpeed / 10));
        }
    });

    // Buttons
    document.getElementById('startBtn').addEventListener('click', startSimulation);
    document.getElementById('pauseBtn').addEventListener('click', pauseSimulation);
    document.getElementById('resetBtn').addEventListener('click', resetSimulation);

    // Random Obstacle Controls
    document.getElementById('randomObstacleBtn').addEventListener('click', () => {
        spawnRandomObstacleNearPath();
    });

    document.getElementById('autoObstacleMode').addEventListener('change', (e) => {
        autoObstacleMode = e.target.checked;
        if (autoObstacleMode && isSimulationRunning) {
            startAutoObstacles();
        } else {
            stopAutoObstacles();
        }
    });

    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            drawMode = btn.dataset.mode;
        });
    });
}

// ===================================
// DRAWING ON CANVAS
// ===================================

function initializeDrawing() {
    let isDrawing = false;

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        handleCanvasClick(e);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDrawing && drawMode === 'obstacle') {
            handleCanvasClick(e);
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isDrawing = false;
    });
}

function handleCanvasClick(e) {
    if (isDemoMode) return; // Disable manual interaction during demo

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return;

    switch (drawMode) {
        case 'start':
            if (destinationPos && destinationPos.row === row && destinationPos.col === col) return;
            startPos = { row, col };
            grid[row][col] = 'start';
            // Create AGV instance immediately to show the car
            if (!agv) {
                agv = new AGV(startPos, startPos, cellSize); // Dummy destination initially
            } else {
                agv.position = { ...startPos };
            }
            break;

        case 'destination':
            if (startPos && startPos.row === row && startPos.col === col) return;
            destinationPos = { row, col };
            grid[row][col] = 'destination';
            break;

        case 'obstacle':
            if ((startPos && startPos.row === row && startPos.col === col) ||
                (destinationPos && destinationPos.row === row && destinationPos.col === col)) return;

            if (grid[row][col] !== 'obstacle') {
                grid[row][col] = 'obstacle';
                obstacles.push({ row, col });

                // Dynamic rerouting if simulation is running
                if (isSimulationRunning && agv) {
                    rerouteCount++;
                    updateStats();
                    recalculatePath();
                }
            }
            break;

        case 'erase':
            if (grid[row][col] === 'obstacle') {
                obstacles = obstacles.filter(obs => !(obs.row === row && obs.col === col));
            }
            grid[row][col] = 'empty';
            break;
    }

    drawGrid();
    hideOverlay();
}

// ===================================
// GRID RENDERING
// ===================================

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid cells
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const x = col * cellSize;
            const y = row * cellSize;

            // Cell background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.fillRect(x, y, cellSize, cellSize);

            // Cell border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize, cellSize);
        }
    }

    // Draw explored nodes
    exploredNodes.forEach(node => {
        drawCell(node.row, node.col, 'rgba(102, 126, 234, 0.1)');
    });

    // Draw path
    currentPath.forEach((node, index) => {
        if (index > 0) {
            const gradient = ctx.createLinearGradient(
                node.col * cellSize,
                node.row * cellSize,
                (node.col + 1) * cellSize,
                (node.row + 1) * cellSize
            );
            gradient.addColorStop(0, '#fa709a');
            gradient.addColorStop(1, '#fee140');
            drawCell(node.row, node.col, gradient, 0.3);
        }
    });

    // Draw obstacles
    obstacles.forEach(obs => {
        const gradient = ctx.createLinearGradient(
            obs.col * cellSize,
            obs.row * cellSize,
            (obs.col + 1) * cellSize,
            (obs.row + 1) * cellSize
        );
        gradient.addColorStop(0, '#30cfd0');
        gradient.addColorStop(1, '#330867');
        drawCell(obs.row, obs.col, gradient, 1, true);
    });

    // Draw start position (Garage/Parking Spot)
    if (startPos) {
        ctx.save();
        ctx.strokeStyle = '#43e97b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
            startPos.col * cellSize + 2,
            startPos.row * cellSize + 2,
            cellSize - 4,
            cellSize - 4
        );
        ctx.restore();

        // If AGV exists, it will be drawn by agv.draw()
        // If not (shouldn't happen if start is set), draw placeholder
        if (!agv) {
            drawIcon(startPos.row, startPos.col, '🏁');
        }
    }

    // Draw destination
    if (destinationPos) {
        const gradient = ctx.createLinearGradient(
            destinationPos.col * cellSize,
            destinationPos.row * cellSize,
            (destinationPos.col + 1) * cellSize,
            (destinationPos.row + 1) * cellSize
        );
        gradient.addColorStop(0, '#f093fb');
        gradient.addColorStop(1, '#f5576c');
        drawCell(destinationPos.row, destinationPos.col, gradient, 1, true);
        drawIcon(destinationPos.row, destinationPos.col, '🎯');
    }

    // Draw AGV
    if (agv) {
        agv.draw(ctx, cellSize, 0, 0);
    }
}

function drawCell(row, col, color, alpha = 1, withShadow = false) {
    const x = col * cellSize;
    const y = row * cellSize;
    const padding = 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;

    if (withShadow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
    }

    ctx.beginPath();
    ctx.roundRect(
        x + padding,
        y + padding,
        cellSize - padding * 2,
        cellSize - padding * 2,
        cellSize * 0.15
    );
    ctx.fill();
    ctx.restore();
}

function drawIcon(row, col, icon) {
    const x = col * cellSize + cellSize / 2;
    const y = row * cellSize + cellSize / 2;

    ctx.save();
    ctx.font = `${cellSize * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, x, y);
    ctx.restore();
}

// ===================================
// SIMULATION CONTROL
// ===================================

function startSimulation() {
    if (!startPos || !destinationPos) {
        alert('Please set both start and destination points!');
        return;
    }

    if (isSimulationRunning) return;

    isSimulationRunning = true;
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    updateStatus('Running', '#43e97b');

    if (!agv) {
        agv = new AGV(startPos, destinationPos, cellSize);
    }

    // Always recalculate path on start to ensure it's fresh
    calculatePath();

    if (currentPath.length > 0) {
        agv.setPath(currentPath);
        agv.setSpeed(1 / (animationSpeed / 10));
        agv.start();
        animate();

        if (autoObstacleMode) {
            startAutoObstacles();
        }
    } else {
        alert('No path found! Please remove some obstacles.');
        resetSimulation();
    }
}

function pauseSimulation() {
    isSimulationRunning = false;
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    updateStatus('Paused', '#fee140');

    if (agv) {
        agv.pause();
    }

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    stopAutoObstacles();
}

function resetSimulation() {
    isSimulationRunning = false;
    isDemoMode = false;
    stopAutoObstacles();

    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    updateStatus('Ready', '#43e97b');

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    initializeGrid();
    startPos = null;
    destinationPos = null;
    agv = null;
    currentPath = [];
    exploredNodes = [];
    rerouteCount = 0;

    updateStats();
    resizeCanvas();
    showOverlay();
}

// ===================================
// RANDOM OBSTACLE LOGIC
// ===================================

function startAutoObstacles() {
    if (autoObstacleInterval) clearInterval(autoObstacleInterval);
    autoObstacleInterval = setInterval(() => {
        if (isSimulationRunning) {
            spawnRandomObstacleNearPath();
        }
    }, 2000); // Spawn every 2 seconds
}

function stopAutoObstacles() {
    if (autoObstacleInterval) {
        clearInterval(autoObstacleInterval);
        autoObstacleInterval = null;
    }
}

function spawnRandomObstacleNearPath() {
    if (!agv || !isSimulationRunning || currentPath.length === 0) return;

    // Get current path index
    const currentIndex = agv.currentPathIndex;

    // Look ahead in the path
    const lookAhead = Math.floor(Math.random() * 5) + 3; // 3 to 7 steps ahead
    const targetIndex = currentIndex + lookAhead;

    if (targetIndex < currentPath.length - 1) { // Don't block destination
        const targetNode = currentPath[targetIndex];

        // 80% chance to block path directly, 20% to block near path
        if (Math.random() < 0.8) {
            addDynamicObstacle(targetNode.row, targetNode.col);
        } else {
            // Try to place near the path
            const neighbors = [
                { r: 0, c: 1 }, { r: 0, c: -1 }, { r: 1, c: 0 }, { r: -1, c: 0 }
            ];
            const offset = neighbors[Math.floor(Math.random() * neighbors.length)];
            addDynamicObstacle(targetNode.row + offset.r, targetNode.col + offset.c);
        }
    }
}

function addDynamicObstacle(row, col) {
    if (!isSimulationRunning) return;

    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        // Don't place on top of AGV or destination
        const agvCell = agv.getCurrentCell();
        if ((row === agvCell.row && col === agvCell.col) ||
            (row === destinationPos.row && col === destinationPos.col)) {
            return;
        }

        if (grid[row][col] === 'empty') {
            grid[row][col] = 'obstacle';
            obstacles.push({ row, col });
            rerouteCount++;
            updateStats();
            recalculatePath();

            // Visual feedback
            updateStatus('Rerouting...', '#fee140');
            setTimeout(() => {
                if (isSimulationRunning) {
                    updateStatus('Running', '#43e97b');
                }
            }, 1000);
        }
    }
}

// ===================================
// PATHFINDING
// ===================================

function calculatePath() {
    const pathfinder = new PathFinder(grid);
    const result = pathfinder.findPath(startPos, destinationPos);

    currentPath = result.path;
    exploredNodes = result.explored;

    updateStats();
    drawGrid();
}

function recalculatePath() {
    if (!agv || !isSimulationRunning) return;

    const currentCell = agv.getCurrentCell();
    const pathfinder = new PathFinder(grid);
    const result = pathfinder.findPath(currentCell, destinationPos);

    if (result.path.length > 0) {
        currentPath = result.path;
        exploredNodes = result.explored;
        agv.setPath(currentPath);
        updateStats();

        // Flash effect for rerouting
        const canvasContainer = document.querySelector('.canvas-container');
        canvasContainer.style.boxShadow = '0 0 30px rgba(255, 200, 0, 0.5)';
        setTimeout(() => {
            canvasContainer.style.boxShadow = 'var(--shadow-md)';
        }, 500);

    } else {
        pauseSimulation();
        alert('Path blocked! Cannot reach destination.');
    }
}

// ===================================
// ANIMATION LOOP
// ===================================

function animate() {
    if (!isSimulationRunning) return;

    const reachedDestination = agv.update();
    drawGrid();

    if (reachedDestination) {
        isSimulationRunning = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        updateStatus('Completed', '#43e97b');
        stopAutoObstacles();

        // Show success message
        showOverlay('success');

        // Continue demo if in demo mode
        if (isDemoMode) {
            setTimeout(() => {
                continueDemo();
            }, 4000); // Wait 4 seconds to show success message
        }
        return;
    }

    animationFrameId = requestAnimationFrame(animate);
}

// ===================================
// AUTOMATED DEMO
// ===================================

function startAutomatedDemo() {
    isDemoMode = true;
    hideOverlay();

    // Set up initial scenario
    gridSize = 20;
    document.getElementById('gridSize').value = gridSize;
    document.getElementById('gridSizeValue').textContent = `${gridSize}x${gridSize}`;

    animationSpeed = 150;
    document.getElementById('animSpeed').value = animationSpeed;
    document.getElementById('animSpeedValue').textContent = `${animationSpeed}ms`;

    initializeGrid();
    resizeCanvas();

    // Set start and destination
    startPos = { row: 2, col: 2 };
    destinationPos = { row: 17, col: 17 };
    grid[startPos.row][startPos.col] = 'start';
    grid[destinationPos.row][destinationPos.col] = 'destination';

    // Create AGV instance
    agv = new AGV(startPos, destinationPos, cellSize);

    // Create initial obstacles (warehouse layout)
    const initialObstacles = [
        // Vertical walls
        ...Array.from({ length: 8 }, (_, i) => ({ row: 5 + i, col: 7 })),
        ...Array.from({ length: 8 }, (_, i) => ({ row: 5 + i, col: 12 })),

        // Horizontal walls
        ...Array.from({ length: 5 }, (_, i) => ({ row: 10, col: 2 + i })),
        ...Array.from({ length: 5 }, (_, i) => ({ row: 15, col: 14 + i })),
    ];

    initialObstacles.forEach(obs => {
        if (obs.row >= 0 && obs.row < gridSize && obs.col >= 0 && obs.col < gridSize) {
            grid[obs.row][obs.col] = 'obstacle';
            obstacles.push(obs);
        }
    });

    drawGrid();

    // Start simulation after a short delay
    setTimeout(() => {
        startSimulation();

        // Enable auto obstacles for demo
        document.getElementById('autoObstacleMode').checked = true;
        autoObstacleMode = true;
        startAutoObstacles();
    }, 1500);
}

function continueDemo() {
    // Reset for next demo cycle
    setTimeout(() => {
        resetSimulation();
        setTimeout(() => {
            startAutomatedDemo();
        }, 2000);
    }, 1000);
}

// ===================================
// UI UPDATES
// ===================================

function updateStats() {
    document.getElementById('pathLength').textContent = currentPath.length;
    document.getElementById('nodesExplored').textContent = exploredNodes.length;
    document.getElementById('obstacleCount').textContent = obstacles.length;
    document.getElementById('rerouteCount').textContent = rerouteCount;
}

function updateStatus(text, color) {
    const statusText = document.getElementById('statusText');
    const statusBadge = document.getElementById('statusBadge');
    const statusDot = statusBadge.querySelector('.status-dot');

    statusText.textContent = text;
    statusDot.style.background = color;
    statusBadge.style.borderColor = color + '50';
    statusBadge.style.background = color + '20';
}

function hideOverlay() {
    const overlay = document.getElementById('canvasOverlay');
    overlay.classList.add('hidden');
}

function showOverlay(type = 'welcome') {
    const overlay = document.getElementById('canvasOverlay');
    const icon = overlay.querySelector('.overlay-icon');
    const title = overlay.querySelector('h3');
    const text = overlay.querySelector('p');

    overlay.classList.remove('hidden');

    if (type === 'success') {
        icon.textContent = '🏆';
        title.textContent = 'Mission Accomplished!';
        text.textContent = 'The AGV has successfully reached its destination.';
        // Re-trigger animation
        icon.style.animation = 'none';
        icon.offsetHeight; /* trigger reflow */
        icon.style.animation = 'float 3s ease-in-out infinite';
    } else {
        icon.textContent = '🚗';
        title.textContent = 'Welcome to AGV Simulator';
        text.textContent = 'Click on the grid to set start and destination points';
        icon.style.animation = 'float 3s ease-in-out infinite';
    }
}
