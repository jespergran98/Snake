// lookAhead.js - Optimized pathfinding with collision avoidance

class GameState {
    constructor(snake, gridSize, obstacles = new Set()) {
        this.snake = [...snake];
        this.gridSize = gridSize;
        this.obstacles = new Set(obstacles);
    }

    moveSnake(direction, ateFood = false) {
        const head = this.snake[0];
        const newHead = {
            x: head.x + direction.x,
            y: head.y + direction.y
        };

        if (!this.isValidPosition(newHead)) return null;

        const newSnake = [newHead, ...this.snake];
        if (!ateFood) newSnake.pop();

        // Update obstacles - only include snake body (excluding head)
        const newObstacles = new Set();
        for (let i = 1; i < newSnake.length; i++) {
            newObstacles.add(`${newSnake[i].x},${newSnake[i].y}`);
        }

        return new GameState(newSnake, this.gridSize, newObstacles);
    }

    isValidPosition(pos) {
        return pos.x >= 0 && pos.x < this.gridSize && 
               pos.y >= 0 && pos.y < this.gridSize && 
               !this.obstacles.has(`${pos.x},${pos.y}`);
    }

    getValidMoves() {
        const directions = [
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        return directions.filter(dir => {
            const newPos = {
                x: this.snake[0].x + dir.x,
                y: this.snake[0].y + dir.y
            };
            return this.isValidPosition(newPos);
        });
    }

    // Optimized flood fill with early termination
    getAvailableSpace() {
        const visited = new Set();
        const queue = [this.snake[0]];
        const startKey = `${this.snake[0].x},${this.snake[0].y}`;
        visited.add(startKey);

        while (queue.length > 0) {
            const current = queue.shift();
            
            // Check 4 directions
            const neighbors = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 }
            ];

            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                if (!visited.has(key) && this.isValidPosition(neighbor)) {
                    visited.add(key);
                    queue.push(neighbor);
                }
            }
        }

        return visited.size;
    }
}

const manhattanDistance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// Streamlined move evaluation with configurable recursion depth
function evaluateMove(gameState, direction, foodPos, depth = 4) {
    if (depth <= 0) {
        const head = gameState.snake[0];
        return {
            score: manhattanDistance(head, foodPos) * -2, // Negative because closer is better
            availableSpace: gameState.getAvailableSpace(),
            distanceToFood: manhattanDistance(head, foodPos)
        };
    }

    const newState = gameState.moveSnake(direction);
    if (!newState) {
        return { score: -1000, availableSpace: 0, distanceToFood: Infinity };
    }

    const newHead = newState.snake[0];
    let score = 0;

    // Distance to food (closer = higher score)
    const distanceToFood = manhattanDistance(newHead, foodPos);
    score += (gameState.gridSize * 2 - distanceToFood) * 3;

    // Available space (critical for survival)
    const availableSpace = newState.getAvailableSpace();
    score += availableSpace * 8;

    // Wall proximity penalty
    const wallDistance = Math.min(
        newHead.x, newHead.y, 
        gameState.gridSize - 1 - newHead.x, 
        gameState.gridSize - 1 - newHead.y
    );
    score -= wallDistance === 0 ? 40 : wallDistance === 1 ? 15 : 0;

    // Future move evaluation
    const futureValidMoves = newState.getValidMoves();
    if (futureValidMoves.length === 0) {
        score -= 400; // Dead end penalty
    } else {
        // Quick evaluation of best future option
        let bestFutureScore = -Infinity;
        for (const futureDir of futureValidMoves) {
            const futureEval = evaluateMove(newState, futureDir, foodPos, depth - 1);
            bestFutureScore = Math.max(bestFutureScore, futureEval.score);
        }
        score += bestFutureScore * 0.6; // Reduced future discount
    }

    return { score, availableSpace, distanceToFood };
}

// Optimized A* pathfinding
function findPath(start, goal, gridSize, obstacles) {
    const openSet = [{
        ...start,
        g: 0,
        h: manhattanDistance(start, goal),
        f: manhattanDistance(start, goal),
        parent: null
    }];
    
    const closedSet = new Set();
    const openSetMap = new Map();
    const startKey = `${start.x},${start.y}`;
    openSetMap.set(startKey, openSet[0]);

    while (openSet.length > 0) {
        // Find lowest f-score node
        const currentIndex = openSet.reduce((minIdx, node, idx) => 
            node.f < openSet[minIdx].f ? idx : minIdx, 0);
        
        const current = openSet.splice(currentIndex, 1)[0];
        const currentKey = `${current.x},${current.y}`;
        openSetMap.delete(currentKey);
        closedSet.add(currentKey);

        if (current.x === goal.x && current.y === goal.y) {
            // Reconstruct path
            const path = [];
            let node = current;
            while (node.parent) {
                path.unshift({ x: node.x, y: node.y });
                node = node.parent;
            }
            return path;
        }

        // Process neighbors
        const directions = [
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        for (const dir of directions) {
            const neighborX = current.x + dir.x;
            const neighborY = current.y + dir.y;
            const neighborKey = `${neighborX},${neighborY}`;

            if (neighborX < 0 || neighborX >= gridSize || 
                neighborY < 0 || neighborY >= gridSize ||
                obstacles.has(neighborKey) || 
                closedSet.has(neighborKey)) {
                continue;
            }

            const tentativeG = current.g + 1;
            const existingNode = openSetMap.get(neighborKey);

            if (!existingNode) {
                const newNode = {
                    x: neighborX,
                    y: neighborY,
                    g: tentativeG,
                    h: manhattanDistance({ x: neighborX, y: neighborY }, goal),
                    parent: current
                };
                newNode.f = newNode.g + newNode.h;

                openSet.push(newNode);
                openSetMap.set(neighborKey, newNode);
            } else if (tentativeG < existingNode.g) {
                existingNode.g = tentativeG;
                existingNode.f = existingNode.g + existingNode.h;
                existingNode.parent = current;
            }
        }
    }

    return [];
}

// Utility function
function getCellCoordinates(cell, gridCells) {
    const index = Array.from(gridCells).indexOf(cell);
    const gridSize = Math.sqrt(gridCells.length);
    return {
        x: index % gridSize,
        y: Math.floor(index / gridSize)
    };
}

// Main AI function - streamlined decision making
window.getNextDirectionWithLookAhead = function(snake, foodCell, gridSize, gridCells, currentDirection) {
    if (!snake || !foodCell || snake.length === 0) return null;

    // Convert snake to coordinates
    const snakeCoords = snake.map(cell => 
        cell ? getCellCoordinates(cell, gridCells) : null
    ).filter(coord => coord !== null);

    if (snakeCoords.length === 0) return null;

    // Create obstacles (snake body excluding head)
    const obstacles = new Set();
    for (let i = 1; i < snakeCoords.length; i++) {
        obstacles.add(`${snakeCoords[i].x},${snakeCoords[i].y}`);
    }

    const gameState = new GameState(snakeCoords, gridSize, obstacles);
    const foodCoords = getCellCoordinates(foodCell, gridCells);
    const validMoves = gameState.getValidMoves();
    
    if (validMoves.length === 0) return currentDirection;

    // Try pathfinding first for efficiency
    const pathToFood = findPath(snakeCoords[0], foodCoords, gridSize, obstacles);
    
    let bestMove = null;
    let bestScore = -Infinity;
    const moveEvaluations = [];

    // Evaluate each move
    for (const move of validMoves) {
        const evaluation = evaluateMove(gameState, move, foodCoords, 4);
        
        // Bonus for following optimal path
        if (pathToFood.length > 0) {
            const nextStep = pathToFood[0];
            if (move.x === (nextStep.x - snakeCoords[0].x) && 
                move.y === (nextStep.y - snakeCoords[0].y)) {
                evaluation.score += 80;
            }
        }

        moveEvaluations.push({ direction: move, ...evaluation });

        if (evaluation.score > bestScore) {
            bestScore = evaluation.score;
            bestMove = move;
        }
    }

    // Safety override: prioritize space if critically low
    const bestEval = moveEvaluations.find(e => 
        e.direction.x === bestMove.x && e.direction.y === bestMove.y
    );

    if (bestEval?.availableSpace < snakeCoords.length + 3) {
        const safestMove = moveEvaluations.reduce((best, current) => 
            current.availableSpace > best.availableSpace ? current : best
        );

        if (safestMove.availableSpace > bestEval.availableSpace + 8) {
            bestMove = safestMove.direction;
        }
    }

    return bestMove;
};

// Main interface function
window.getNextDirection = function(snake, foodCell, gridSize, gridCells) {
    const currentDirection = window.getDirection?.() || { x: 1, y: 0 };
    return window.getNextDirectionWithLookAhead(
        snake, foodCell, gridSize, gridCells, currentDirection
    ) || currentDirection;
};