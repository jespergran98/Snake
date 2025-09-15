// lookAhead.js - Optimized pathfinding with collision avoidance and adaptive lookahead

class GameState {
    constructor(snake, gridSize, obstacles = new Set()) {
        this.snake = [...snake];
        this.gridSize = gridSize;
        this.obstacles = new Set(obstacles);
    }

    moveSnake(direction, ateFood = false) {
        const head = this.snake[0];
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };

        if (!this.isValidPosition(newHead)) return null;

        const newSnake = [newHead, ...this.snake];
        if (!ateFood) newSnake.pop();

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
            const newPos = { x: this.snake[0].x + dir.x, y: this.snake[0].y + dir.y };
            return this.isValidPosition(newPos);
        });
    }

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

const manhattanDistance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

function evaluateMove(gameState, direction, foodPos, depth = 4) {
    if (depth <= 0) {
        const head = gameState.snake[0];
        return {
            score: -2 * manhattanDistance(head, foodPos),
            availableSpace: gameState.getAvailableSpace(),
            distanceToFood: manhattanDistance(head, foodPos)
        };
    }

    const newState = gameState.moveSnake(direction);
    if (!newState) return { score: -1000, availableSpace: 0, distanceToFood: Infinity };

    const newHead = newState.snake[0];
    let score = 0;

    const distanceToFood = manhattanDistance(newHead, foodPos);
    score += (gameState.gridSize * 2 - distanceToFood) * 3;

    const availableSpace = newState.getAvailableSpace();
    score += availableSpace * 8;

    const wallDistance = Math.min(
        newHead.x, newHead.y,
        gameState.gridSize - 1 - newHead.x,
        gameState.gridSize - 1 - newHead.y
    );
    score -= wallDistance === 0 ? 40 : wallDistance === 1 ? 15 : 0;

    const futureValidMoves = newState.getValidMoves();
    if (futureValidMoves.length === 0) {
        score -= 400;
    } else {
        let futureScores = [];
        for (const futureDir of futureValidMoves) {
            const futureEval = evaluateMove(newState, futureDir, foodPos, depth - 1);
            futureScores.push(futureEval.score);
        }
        const avgFutureScore = futureScores.reduce((a, b) => a + b, 0) / futureScores.length;
        score += avgFutureScore * 0.5;
    }

    return { score, availableSpace, distanceToFood };
}

function findPath(start, goal, gridSize, obstacles) {
    const openSet = [{
        ...start, g: 0,
        h: manhattanDistance(start, goal),
        f: manhattanDistance(start, goal),
        parent: null
    }];
    
    const closedSet = new Set();
    const openSetMap = new Map();
    openSetMap.set(`${start.x},${start.y}`, openSet[0]);

    while (openSet.length > 0) {
        const currentIndex = openSet.reduce((minIdx, node, idx) => 
            node.f < openSet[minIdx].f ? idx : minIdx, 0);
        const current = openSet.splice(currentIndex, 1)[0];
        const currentKey = `${current.x},${current.y}`;
        openSetMap.delete(currentKey);
        closedSet.add(currentKey);

        if (current.x === goal.x && current.y === goal.y) {
            const path = [];
            let node = current;
            while (node.parent) {
                path.unshift({ x: node.x, y: node.y });
                node = node.parent;
            }
            return path;
        }

        const directions = [
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        for (const dir of directions) {
            const nx = current.x + dir.x, ny = current.y + dir.y;
            const nKey = `${nx},${ny}`;

            if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize ||
                obstacles.has(nKey) || closedSet.has(nKey)) continue;

            const tentativeG = current.g + 1;
            const existingNode = openSetMap.get(nKey);

            if (!existingNode) {
                const newNode = {
                    x: nx, y: ny,
                    g: tentativeG,
                    h: manhattanDistance({ x: nx, y: ny }, goal),
                    parent: current
                };
                newNode.f = newNode.g + newNode.h;
                openSet.push(newNode);
                openSetMap.set(nKey, newNode);
            } else if (tentativeG < existingNode.g) {
                existingNode.g = tentativeG;
                existingNode.f = existingNode.g + existingNode.h;
                existingNode.parent = current;
            }
        }
    }
    return [];
}

function getCellCoordinates(cell, gridCells) {
    const index = Array.from(gridCells).indexOf(cell);
    const gridSize = Math.sqrt(gridCells.length);
    return { x: index % gridSize, y: Math.floor(index / gridSize) };
}

window.getNextDirectionWithLookAhead = function(snake, foodCell, gridSize, gridCells, currentDirection) {
    if (!snake || !foodCell || snake.length === 0) return null;

    const snakeCoords = snake.map(cell => cell ? getCellCoordinates(cell, gridCells) : null)
                             .filter(coord => coord !== null);
    if (snakeCoords.length === 0) return null;

    const obstacles = new Set();
    for (let i = 1; i < snakeCoords.length; i++) {
        obstacles.add(`${snakeCoords[i].x},${snakeCoords[i].y}`);
    }

    const gameState = new GameState(snakeCoords, gridSize, obstacles);
    const foodCoords = getCellCoordinates(foodCell, gridCells);
    const validMoves = gameState.getValidMoves();
    if (validMoves.length === 0) return currentDirection;

    const pathToFood = findPath(snakeCoords[0], foodCoords, gridSize, obstacles);

    let bestMove = null;
    let bestScore = -Infinity;
    const moveEvaluations = [];

    const adaptiveDepth = gameState.getAvailableSpace() > snakeCoords.length * 2 ? 5 : 3;

    for (const move of validMoves) {
        const evaluation = evaluateMove(gameState, move, foodCoords, adaptiveDepth);

        if (pathToFood.length > 0) {
            const nextStep = pathToFood[0];
            if (move.x === (nextStep.x - snakeCoords[0].x) && 
                move.y === (nextStep.y - snakeCoords[0].y)) {
                evaluation.score += 80;
            }
            if (pathToFood.length > 2) {
                evaluation.score += 20;
            }
        }

        moveEvaluations.push({ direction: move, ...evaluation });

        if (evaluation.score > bestScore) {
            bestScore = evaluation.score;
            bestMove = move;
        }
    }

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

window.getNextDirection = function(snake, foodCell, gridSize, gridCells) {
    const currentDirection = window.getDirection?.() || { x: 1, y: 0 };
    return window.getNextDirectionWithLookAhead(
        snake, foodCell, gridSize, gridCells, currentDirection
    ) || currentDirection;
};
