// lookAhead.js - Advanced pathfinding with collision avoidance

class GameState {
    constructor(snake, gridSize, obstacles = new Set()) {
        this.snake = [...snake]; // Copy snake array
        this.gridSize = gridSize;
        this.obstacles = new Set(obstacles); // Copy obstacles
    }

    // Simulate moving the snake in a given direction
    moveSnake(direction, ateFood = false) {
        const head = this.snake[0];
        const newHead = {
            x: head.x + direction.x,
            y: head.y + direction.y
        };

        // Check if move is valid (within bounds and not hitting snake body)
        if (!this.isValidPosition(newHead)) {
            return null; // Invalid move
        }

        // Create new snake with new head
        const newSnake = [newHead, ...this.snake];
        
        // If didn't eat food, remove tail
        if (!ateFood) {
            newSnake.pop();
        }

        // Update obstacles set
        const newObstacles = new Set();
        for (let i = 1; i < newSnake.length; i++) { // Skip head
            newObstacles.add(`${newSnake[i].x},${newSnake[i].y}`);
        }

        return new GameState(newSnake, this.gridSize, newObstacles);
    }

    isValidPosition(pos) {
        // Check bounds
        if (pos.x < 0 || pos.x >= this.gridSize || pos.y < 0 || pos.y >= this.gridSize) {
            return false;
        }
        
        // Check if position is occupied by snake body
        const posKey = `${pos.x},${pos.y}`;
        return !this.obstacles.has(posKey);
    }

    getValidMoves() {
        const directions = [
            { x: 0, y: -1, name: 'up' },
            { x: 0, y: 1, name: 'down' },
            { x: -1, y: 0, name: 'left' },
            { x: 1, y: 0, name: 'right' }
        ];

        const validMoves = [];
        const head = this.snake[0];

        for (const dir of directions) {
            const newPos = {
                x: head.x + dir.x,
                y: head.y + dir.y
            };

            if (this.isValidPosition(newPos)) {
                validMoves.push(dir);
            }
        }

        return validMoves;
    }

    // Calculate available space from current head position using flood fill
    getAvailableSpace() {
        const visited = new Set();
        const queue = [this.snake[0]];
        visited.add(`${this.snake[0].x},${this.snake[0].y}`);

        while (queue.length > 0) {
            const current = queue.shift();

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

function manhattanDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Look ahead multiple moves to evaluate safety
function evaluateMove(gameState, direction, foodPos, depth = 3) {
    if (depth <= 0) {
        return {
            score: 0,
            availableSpace: gameState.getAvailableSpace(),
            distanceToFood: manhattanDistance(gameState.snake[0], foodPos)
        };
    }

    // Simulate the move
    const newState = gameState.moveSnake(direction);
    if (!newState) {
        return {
            score: -1000, // Invalid move penalty
            availableSpace: 0,
            distanceToFood: Infinity
        };
    }

    const newHead = newState.snake[0];
    let score = 0;

    // Reward getting closer to food
    const distanceToFood = manhattanDistance(newHead, foodPos);
    score += (gameState.gridSize * 2 - distanceToFood) * 2;

    // Heavily reward available space (prevents getting trapped)
    const availableSpace = newState.getAvailableSpace();
    score += availableSpace * 10;

    // Penalty for being too close to walls or corners
    const wallDistance = Math.min(
        newHead.x, 
        newHead.y, 
        gameState.gridSize - 1 - newHead.x, 
        gameState.gridSize - 1 - newHead.y
    );
    if (wallDistance === 0) score -= 50; // Against wall
    if (wallDistance === 1) score -= 20; // One step from wall

    // Look ahead recursively for longer-term planning
    const futureValidMoves = newState.getValidMoves();
    if (futureValidMoves.length === 0) {
        score -= 500; // Dead end
    } else {
        // Evaluate best future move
        let bestFutureScore = -Infinity;
        for (const futureDir of futureValidMoves) {
            const futureEval = evaluateMove(newState, futureDir, foodPos, depth - 1);
            bestFutureScore = Math.max(bestFutureScore, futureEval.score);
        }
        score += bestFutureScore * 0.7; // Discount future rewards
    }

    return {
        score: score,
        availableSpace: availableSpace,
        distanceToFood: distanceToFood
    };
}

// Enhanced A* with look-ahead safety checks
function safeFindPath(start, goal, gridSize, obstacles) {
    const openSet = [{
        x: start.x,
        y: start.y,
        g: 0,
        h: manhattanDistance(start, goal),
        f: manhattanDistance(start, goal),
        parent: null
    }];
    
    const closedSet = new Set();
    const openSetMap = new Map();
    openSetMap.set(`${start.x},${start.y}`, openSet[0]);

    while (openSet.length > 0) {
        // Find node with lowest f score
        let currentIndex = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < openSet[currentIndex].f) {
                currentIndex = i;
            }
        }

        const current = openSet.splice(currentIndex, 1)[0];
        const currentKey = `${current.x},${current.y}`;
        openSetMap.delete(currentKey);
        closedSet.add(currentKey);

        // Check if we reached the goal
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

        // Check neighbors
        const directions = [
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        for (const dir of directions) {
            const neighborX = current.x + dir.x;
            const neighborY = current.y + dir.y;
            const neighborKey = `${neighborX},${neighborY}`;

            // Check bounds
            if (neighborX < 0 || neighborX >= gridSize || 
                neighborY < 0 || neighborY >= gridSize) {
                continue;
            }

            // Check obstacles
            if (obstacles.has(neighborKey)) {
                continue;
            }

            if (closedSet.has(neighborKey)) {
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

// Enhanced direction selection with look-ahead
window.getNextDirectionWithLookAhead = function(snake, foodCell, gridSize, gridCells, currentDirection) {
    if (!snake || !foodCell || snake.length === 0) {
        return null;
    }

    // Convert snake cells to coordinates
    const snakeCoords = snake.map(cell => 
        cell ? getCellCoordinates(cell, gridCells) : null
    ).filter(coord => coord !== null);

    if (snakeCoords.length === 0) return null;

    // Create obstacles set (snake body excluding head)
    const obstacles = new Set();
    for (let i = 1; i < snakeCoords.length; i++) {
        obstacles.add(`${snakeCoords[i].x},${snakeCoords[i].y}`);
    }

    // Create game state
    const gameState = new GameState(snakeCoords, gridSize, obstacles);
    const foodCoords = getCellCoordinates(foodCell, gridCells);

    // Get all valid moves
    const validMoves = gameState.getValidMoves();
    
    if (validMoves.length === 0) {
        return currentDirection; // No valid moves, continue current direction
    }

    // First, try to find a path to food
    const pathToFood = safeFindPath(snakeCoords[0], foodCoords, gridSize, obstacles);
    
    let bestMove = null;
    let bestScore = -Infinity;
    let moveEvaluations = [];

    // Evaluate each possible move
    for (const move of validMoves) {
        const evaluation = evaluateMove(gameState, move, foodCoords, 4); // Look 4 moves ahead
        moveEvaluations.push({
            direction: move,
            ...evaluation
        });

        // Bonus if this move is on the path to food
        if (pathToFood.length > 0) {
            const nextStep = pathToFood[0];
            if (move.x === (nextStep.x - snakeCoords[0].x) && 
                move.y === (nextStep.y - snakeCoords[0].y)) {
                evaluation.score += 100; // Bonus for following optimal path
            }
        }

        if (evaluation.score > bestScore) {
            bestScore = evaluation.score;
            bestMove = move;
        }
    }

    // Safety check: if the best move has very low available space, 
    // prefer the move with the most available space
    const bestEvaluation = moveEvaluations.find(evaluation => 
        evaluation.direction.x === bestMove.x && evaluation.direction.y === bestMove.y
    );

    if (bestEvaluation && bestEvaluation.availableSpace < snakeCoords.length + 5) {
        const safestMove = moveEvaluations.reduce((best, current) => 
            current.availableSpace > best.availableSpace ? current : best
        );

        if (safestMove.availableSpace > bestEvaluation.availableSpace + 10) {
            bestMove = safestMove.direction;
        }
    }

    return bestMove;
};

// Replace the original getNextDirection function
window.getNextDirection = function(snake, foodCell, gridSize, gridCells) {
    const currentDirection = window.getDirection ? window.getDirection() : { x: 1, y: 0 };
    
    const nextDir = window.getNextDirectionWithLookAhead(
        snake, foodCell, gridSize, gridCells, currentDirection
    );
    
    return nextDir || currentDirection;
};