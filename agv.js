// ===================================
// AGV (Automated Guided Vehicle) CLASS
// ===================================

class AGV {
    constructor(startPos, destinationPos, cellSize) {
        this.position = { ...startPos };
        this.destination = { ...destinationPos };
        this.cellSize = cellSize;
        this.path = [];
        this.currentPathIndex = 0;
        this.isMoving = false;
        this.animationProgress = 0;
        this.speed = 0.05; // Animation speed
        this.rotation = 0;
        this.targetRotation = 0;
        this.wheelRotation = 0;
    }

    setPath(path) {
        this.path = path;
        this.currentPathIndex = 0;
        this.animationProgress = 0;
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    getCurrentCell() {
        return {
            row: Math.round(this.position.row),
            col: Math.round(this.position.col)
        };
    }

    getNextCell() {
        if (this.currentPathIndex < this.path.length - 1) {
            return this.path[this.currentPathIndex + 1];
        }
        return null;
    }

    calculateRotation(from, to) {
        const deltaRow = to.row - from.row;
        const deltaCol = to.col - from.col;

        if (deltaRow === -1) return 270; // Up
        if (deltaRow === 1) return 90;   // Down
        if (deltaCol === -1) return 180; // Left
        if (deltaCol === 1) return 0;    // Right

        return this.rotation;
    }

    update() {
        if (!this.isMoving || this.currentPathIndex >= this.path.length - 1) {
            return false;
        }

        const current = this.path[this.currentPathIndex];
        const next = this.path[this.currentPathIndex + 1];

        // Calculate target rotation
        this.targetRotation = this.calculateRotation(current, next);

        // Smooth rotation
        let rotDiff = this.targetRotation - this.rotation;
        if (rotDiff > 180) rotDiff -= 360;
        if (rotDiff < -180) rotDiff += 360;

        // Dynamic rotation speed based on how sharp the turn is
        const turnSpeed = 0.15;
        this.rotation += rotDiff * turnSpeed;

        // Update animation progress
        // Use linear movement for smooth, constant velocity
        this.animationProgress += this.speed;
        this.wheelRotation += this.speed * 20; // Spin wheels

        if (this.animationProgress >= 1) {
            this.animationProgress = 0;
            this.currentPathIndex++;

            if (this.currentPathIndex >= this.path.length - 1) {
                this.position = { ...this.path[this.path.length - 1] };
                this.isMoving = false;
                return true; // Reached destination
            }
        }

        // Linear interpolation for constant speed (removes the "stop-and-go" effect)
        const t = this.animationProgress;

        this.position.row = current.row + (next.row - current.row) * t;
        this.position.col = current.col + (next.col - current.col) * t;

        return false;
    }

    start() {
        this.isMoving = true;
    }

    pause() {
        this.isMoving = false;
    }

    reset(startPos) {
        this.position = { ...startPos };
        this.currentPathIndex = 0;
        this.animationProgress = 0;
        this.isMoving = false;
        this.rotation = 0;
    }

    draw(ctx, cellSize, offsetX, offsetY) {
        const x = offsetX + this.position.col * cellSize + cellSize / 2;
        const y = offsetY + this.position.row * cellSize + cellSize / 2;

        // Scale car to fit cell but leave some room
        const scale = cellSize / 40;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.scale(scale, scale);

        // Draw Headlights (Light beams)
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const beamGrad = ctx.createLinearGradient(15, 0, 80, 0);
        beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        // Left beam
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(15, -8);
        ctx.lineTo(80, -25);
        ctx.lineTo(80, 5);
        ctx.fill();

        // Right beam
        ctx.beginPath();
        ctx.moveTo(15, 8);
        ctx.lineTo(80, -5);
        ctx.lineTo(80, 25);
        ctx.fill();
        ctx.restore();

        // Draw Car Body Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.roundRect(-22, -14, 44, 28, 8);
        ctx.fill();

        // Draw Wheels
        ctx.fillStyle = '#1a1a1a';
        // Front Left
        ctx.fillRect(8, -16, 10, 4);
        // Front Right
        ctx.fillRect(8, 12, 10, 4);
        // Rear Left
        ctx.fillRect(-18, -16, 10, 4);
        // Rear Right
        ctx.fillRect(-18, 12, 10, 4);

        // Draw Main Body (Sports Car Shape)
        const bodyGrad = ctx.createLinearGradient(-20, 0, 20, 0);
        bodyGrad.addColorStop(0, '#2c3e50');
        bodyGrad.addColorStop(0.5, '#4ca1af');
        bodyGrad.addColorStop(1, '#2c3e50');

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        // Hood
        ctx.moveTo(20, -10);
        ctx.lineTo(22, -5);
        ctx.lineTo(22, 5);
        ctx.lineTo(20, 10);
        // Side
        ctx.lineTo(-15, 12);
        // Rear
        ctx.lineTo(-20, 10);
        ctx.lineTo(-20, -10);
        ctx.lineTo(-15, -12);
        ctx.closePath();
        ctx.fill();

        // Roof/Windshield
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.moveTo(5, -8);
        ctx.lineTo(10, -6);
        ctx.lineTo(10, 6);
        ctx.lineTo(5, 8);
        ctx.lineTo(-10, 7);
        ctx.lineTo(-10, -7);
        ctx.closePath();
        ctx.fill();

        // Windshield Glare
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.moveTo(5, -6);
        ctx.lineTo(8, -5);
        ctx.lineTo(8, 5);
        ctx.lineTo(5, 6);
        ctx.fill();

        // Headlights (Lamps)
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(20, -8, 2, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(20, 8, 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Taillights
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.rect(-20, -10, 2, 6);
        ctx.rect(-20, 4, 2, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Spoiler
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-18, -11, 4, 22);

        ctx.restore();
    }
}

// ===================================
// CANVAS HELPER FUNCTIONS
// ===================================

if (typeof CanvasRenderingContext2D !== 'undefined') {
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
            if (width < 2 * radius) radius = width / 2;
            if (height < 2 * radius) radius = height / 2;
            this.beginPath();
            this.moveTo(x + radius, y);
            this.arcTo(x + width, y, x + width, y + height, radius);
            this.arcTo(x + width, y + height, x, y + height, radius);
            this.arcTo(x, y + height, x, y, radius);
            this.arcTo(x, y, x + width, y, radius);
            this.closePath();
            return this;
        };
    }
}
