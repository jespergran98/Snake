// Logic/a_star_algorithm.js

class Node {
    constructor(x, y, g = 0, h = 0, parent = null) {
        this.x = x;
        this.y = y;
        this.g = g; // Cost from start to current node
        this.h = h; // Heuristic cost from current node to goal
        this.f = g + h; // Total cost
        this.parent = parent;
    }

    equals(other) {
        return this.x === other.x && this.y === other.y;
    }

    toString() {
        return `${this.x},${this.y}`;
    }
}

function manhattanDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getNeighbors(node, gridSize, obstacles) {
    const neighbors = [];
    const directions = [
        { x: 0, y: -1 }, // Up
        { x: 0, y: 1 },  // Down
        { x: -1, y: 0 }, // Left
        { x: 1, y: 0 }   // Right
    ];

    for (const dir of directions) {
        const newX = node.x + dir.x;
        const newY = node.y + dir.y;

        // Check bounds
        if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
            // Check if position is not an obstacle (snake body)
            const posKey = `${newX},${newY}`;
            if (!obstacles.has(posKey)) {
                neighbors.push(new Node(newX, newY));
            }
        }
    }

    return neighbors;
}

function reconstructPath(node) {
    const path = [];
    let current = node;
    
    while (current.parent) {
        path.unshift(current);
        current = current.parent;
    }
    
    return path;
}

function aStar(start, goal, gridSize, obstacles) {
    const openSet = [new Node(start.x, start.y, 0, manhattanDistance(start, goal))];
    const closedSet = new Set();
    const openSetMap = new Map();
    openSetMap.set(openSet[0].toString(), openSet[0]);

    while (openSet.length > 0) {
        // Find node with lowest f score
        let currentIndex = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < openSet[currentIndex].f) {
                currentIndex = i;
            }
        }

        const current = openSet.splice(currentIndex, 1)[0];
        openSetMap.delete(current.toString());
        closedSet.add(current.toString());

        // Check if we reached the goal
        if (current.x === goal.x && current.y === goal.y) {
            return reconstructPath(current);
        }

        // Check neighbors
        const neighbors = getNeighbors(current, gridSize, obstacles);
        
        for (const neighbor of neighbors) {
            const neighborKey = neighbor.toString();
            
            if (closedSet.has(neighborKey)) {
                continue;
            }

            const tentativeG = current.g + 1;
            
            const existingNode = openSetMap.get(neighborKey);
            if (!existingNode) {
                neighbor.g = tentativeG;
                neighbor.h = manhattanDistance(neighbor, goal);
                neighbor.f = neighbor.g + neighbor.h;
                neighbor.parent = current;
                
                openSet.push(neighbor);
                openSetMap.set(neighborKey, neighbor);
            } else if (tentativeG < existingNode.g) {
                existingNode.g = tentativeG;
                existingNode.f = existingNode.g + existingNode.h;
                existingNode.parent = current;
            }
        }
    }

    return []; // No path found
}

function getCellCoordinates(cell, gridCells) {
    const index = Array.from(gridCells).indexOf(cell);
    const gridSize = Math.sqrt(gridCells.length);
    return {
        x: index % gridSize,
        y: Math.floor(index / gridSize)
    };
}

function getDirectionFromPath(currentPos, nextPos) {
    const dx = nextPos.x - currentPos.x;
    const dy = nextPos.y - currentPos.y;
    return { x: dx, y: dy };
}

// Main function to get next direction using A* algorithm
window.getNextDirection = function(snake, foodCell, gridSize, gridCells) {
    if (!snake || !foodCell || snake.length === 0) {
        return null;
    }

    // Get current head position
    const head = snake[0];
    const headCoords = getCellCoordinates(head, gridCells);
    
    // Get food position
    const foodCoords = getCellCoordinates(foodCell, gridCells);

    // Create obstacles set (snake body excluding head)
    const obstacles = new Set();
    for (let i = 1; i < snake.length; i++) {
        if (snake[i]) {
            const coords = getCellCoordinates(snake[i], gridCells);
            obstacles.add(`${coords.x},${coords.y}`);
        }
    }

    // Find path using A*
    const path = aStar(headCoords, foodCoords, gridSize, obstacles);
    
    if (path.length > 0) {
        // Return direction to first step in path
        return getDirectionFromPath(headCoords, path[0]);
    }

    // If no path to food, try to move to the largest open area
    // This is a fallback strategy to avoid getting trapped
    const directions = [
        { x: 0, y: -1 }, // Up
        { x: 0, y: 1 },  // Down
        { x: -1, y: 0 }, // Left
        { x: 1, y: 0 }   // Right
    ];

    for (const dir of directions) {
        const newX = headCoords.x + dir.x;
        const newY = headCoords.y + dir.y;
        
        // Check if the move is valid
        if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
            const posKey = `${newX},${newY}`;
            if (!obstacles.has(posKey)) {
                return dir;
            }
        }
    }

    // If all else fails, continue in current direction
    return window.getDirection();
};