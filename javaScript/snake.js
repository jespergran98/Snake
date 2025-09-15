document.addEventListener('DOMContentLoaded', () => {
    const gridCells = document.querySelectorAll('.grid-cell');
    const gridSize = 17;
    const manualBtn = document.getElementById('manual-btn');
    const automaticBtn = document.getElementById('automatic-btn');
    const scoreDisplay = document.getElementById('score-display');

    let snake = [
        getCell(2, 8),
        getCell(1, 8),
        getCell(0, 8)
    ];
    let direction = { x: 1, y: 0 };
    let snakeSpeed = 10;
    let foodCell;
    let score = 0;
    let gameRunning = false;
    let gameMode = 'manual'; // 'manual' or 'automatic'
    let gameLoopTimeout;

    function getCell(x, y) {
        // Return null if coordinates are out of bounds
        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
            return null;
        }
        return gridCells[y * gridSize + x];
    }

    function getCellCoordinates(cell) {
        const index = Array.from(gridCells).indexOf(cell);
        return {
            x: index % gridSize,
            y: Math.floor(index / gridSize)
        };
    }

    function getSegmentDirection(currentCell, nextCell) {
        if (!currentCell || !nextCell) return 'horizontal'; // default
        
        const currentCoords = getCellCoordinates(currentCell);
        const nextCoords = getCellCoordinates(nextCell);
        
        // If moving horizontally (x changes), make it horizontally oriented
        if (currentCoords.x !== nextCoords.x) {
            return 'horizontal';
        }
        // If moving vertically (y changes), make it vertically oriented
        else {
            return 'vertical';
        }
    }

    function updateSnakeSegmentClasses() {
        snake.forEach((cell, index) => {
            if (!cell) return;
            
            // Remove existing directional classes
            cell.classList.remove('snake-horizontal', 'snake-vertical');
            
            let segmentDirection;
            
            if (index === 0) {
                // Head: use current movement direction
                if (direction.x !== 0) {
                    segmentDirection = 'horizontal';
                } else {
                    segmentDirection = 'vertical';
                }
            } else {
                // Body segments: determine direction based on adjacent segments
                const prevCell = snake[index - 1];
                const nextCell = snake[index + 1];
                
                if (prevCell && nextCell) {
                    // Middle segment: check if it's part of a turn
                    const prevCoords = getCellCoordinates(prevCell);
                    const currentCoords = getCellCoordinates(cell);
                    const nextCoords = getCellCoordinates(nextCell);
                    
                    const prevDirection = {
                        x: currentCoords.x - prevCoords.x,
                        y: currentCoords.y - prevCoords.y
                    };
                    const nextDirection = {
                        x: nextCoords.x - currentCoords.x,
                        y: nextCoords.y - currentCoords.y
                    };
                    
                    // If directions are the same, use that direction
                    if (prevDirection.x === nextDirection.x && prevDirection.y === nextDirection.y) {
                        segmentDirection = prevDirection.x !== 0 ? 'horizontal' : 'vertical';
                    } else {
                        // At a turn, use the incoming direction
                        segmentDirection = prevDirection.x !== 0 ? 'horizontal' : 'vertical';
                    }
                } else if (prevCell) {
                    // Tail or near tail: use direction from previous segment
                    segmentDirection = getSegmentDirection(prevCell, cell);
                } else {
                    // Fallback
                    segmentDirection = 'horizontal';
                }
            }
            
            cell.classList.add('snake-' + segmentDirection);
        });
    }

    function createSnake() {
        snake.forEach(cell => {
            if (cell) {
                cell.classList.add('snake');
            }
        });
        updateSnakeSegmentClasses();
    }

    function createFood() {
        let newFoodCell;
        do {
            const randomIndex = Math.floor(Math.random() * gridSize * gridSize);
            newFoodCell = gridCells[randomIndex];
        } while (newFoodCell.classList.contains('snake'));

        if (foodCell) {
            foodCell.classList.remove('apple');
        }
        foodCell = newFoodCell;
        foodCell.classList.add('apple');
    }

    function updateScore() {
        scoreDisplay.textContent = score;
    }

    function gameOver() {
        gameRunning = false;
        if (gameLoopTimeout) {
            clearTimeout(gameLoopTimeout);
        }
        alert('Game Over! Score: ' + score);
        resetGame();
    }

    function resetGame() {
        // Clear all snake and apple classes
        gridCells.forEach(cell => {
            cell.classList.remove('snake', 'apple', 'snake-horizontal', 'snake-vertical');
        });

        // Reset snake to initial position
        snake = [
            getCell(2, 8),
            getCell(1, 8),
            getCell(0, 8)
        ];
        direction = { x: 1, y: 0 };
        score = 0;
        updateScore();

        // Recreate initial game state
        createSnake();
        createFood();
    }

    function gameLoop() {
        if (!gameRunning) return;

        // Get the current head position
        const head = snake[0];
        const headCoords = getCellCoordinates(head);

        // In automatic mode, get direction from A* algorithm
        if (gameMode === 'automatic' && window.getNextDirection) {
            const nextDir = window.getNextDirection(snake, foodCell, gridSize, gridCells);
            if (nextDir) {
                direction = nextDir;
            }
        }

        // Calculate the new head position
        const newHeadX = headCoords.x + direction.x;
        const newHeadY = headCoords.y + direction.y;

        // Get the new head cell
        const newHead = getCell(newHeadX, newHeadY);

        // Check for collision with self or walls
        if (!newHead || newHead.classList.contains('snake')) {
            gameOver();
            return;
        }

        // Add the new head to the snake
        snake.unshift(newHead);
        newHead.classList.add('snake');

        // Check if the new head is on an apple
        if (newHead === foodCell) {
            newHead.classList.remove('apple');
            score++;
            updateScore();
            createFood();
        } else {
            // Remove the tail if no food was eaten
            const tail = snake.pop();
            if (tail) {
                tail.classList.remove('snake', 'snake-horizontal', 'snake-vertical');
            }
        }

        // Update all snake segment classes based on current directions
        updateSnakeSegmentClasses();

        gameLoopTimeout = setTimeout(gameLoop, snakeSpeed);
    }

    function startGame() {
        if (!gameRunning) {
            gameRunning = true;
            gameLoop();
        }
    }

    function stopGame() {
        gameRunning = false;
        if (gameLoopTimeout) {
            clearTimeout(gameLoopTimeout);
        }
    }

    // Button event listeners
    manualBtn.addEventListener('click', () => {
        if (gameMode !== 'manual') {
            stopGame();
            gameMode = 'manual';
            manualBtn.classList.add('active');
            automaticBtn.classList.remove('active');
            startGame();
        }
    });

    automaticBtn.addEventListener('click', () => {
        if (gameMode !== 'automatic') {
            stopGame();
            gameMode = 'automatic';
            automaticBtn.classList.add('active');
            manualBtn.classList.remove('active');
            startGame();
        }
    });

    // Set up the initial game state
    createSnake();
    createFood();
    updateScore();
    startGame();

    // Expose functions and variables for other modules
    window.setDirection = (newDirection) => {
        if (gameMode === 'manual') {
            direction = newDirection;
        }
    };
    
    window.getDirection = () => direction;
    window.getGameMode = () => gameMode;
    window.getSnake = () => snake;
    window.getFoodCell = () => foodCell;
    window.getGridSize = () => gridSize;
    window.getGridCells = () => gridCells;
});