// ===================================
// A* PATHFINDING ALGORITHM
// ===================================

class PathFinder {
    constructor(grid) {
        this.grid = grid;
        this.rows = grid.length;
        this.cols = grid[0].length;
    }

    // Heuristic function (Manhattan distance)
    heuristic(a, b) {
        return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    }

    // Get neighbors of a cell
    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { row: -1, col: 0 },  // Up
            { row: 1, col: 0 },   // Down
            { row: 0, col: -1 },  // Left
            { row: 0, col: 1 }    // Right
        ];

        for (const dir of directions) {
            const newRow = node.row + dir.row;
            const newCol = node.col + dir.col;

            if (
                newRow >= 0 && newRow < this.rows &&
                newCol >= 0 && newCol < this.cols &&
                this.grid[newRow][newCol] !== 'obstacle'
            ) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }

        return neighbors;
    }

    // A* pathfinding algorithm
    findPath(start, end) {
        const openSet = [start];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        const explored = [];

        const key = (node) => `${node.row},${node.col}`;

        gScore.set(key(start), 0);
        fScore.set(key(start), this.heuristic(start, end));

        while (openSet.length > 0) {
            // Find node with lowest fScore
            let current = openSet[0];
            let currentIndex = 0;

            for (let i = 1; i < openSet.length; i++) {
                if (fScore.get(key(openSet[i])) < fScore.get(key(current))) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }

            // Check if we reached the goal
            if (current.row === end.row && current.col === end.col) {
                return {
                    path: this.reconstructPath(cameFrom, current),
                    explored: explored
                };
            }

            // Move current from open to closed set
            openSet.splice(currentIndex, 1);
            closedSet.add(key(current));
            explored.push({ ...current });

            // Check all neighbors
            const neighbors = this.getNeighbors(current);

            for (const neighbor of neighbors) {
                const neighborKey = key(neighbor);

                if (closedSet.has(neighborKey)) {
                    continue;
                }

                const tentativeGScore = gScore.get(key(current)) + 1;

                // Check if neighbor is in openSet
                const neighborInOpen = openSet.find(
                    n => n.row === neighbor.row && n.col === neighbor.col
                );

                if (!neighborInOpen) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= gScore.get(neighborKey)) {
                    continue;
                }

                // This path is the best so far
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, end));
            }
        }

        // No path found
        return { path: [], explored: explored };
    }

    // Reconstruct path from start to end
    reconstructPath(cameFrom, current) {
        const path = [current];
        const key = (node) => `${node.row},${node.col}`;

        while (cameFrom.has(key(current))) {
            current = cameFrom.get(key(current));
            path.unshift(current);
        }

        return path;
    }
}
