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
    let manualSpeed = 100;  // Speed for manual mode
    let automaticSpeed = 10; // Speed for automatic mode
    let foodCell;
    let score = 0;
    let gameRunning = false;
    let gameMode = 'manual';
    let gameLoopTimeout;

    // Utility functions
    function getCell(x, y) {
        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return null;
        return gridCells[y * gridSize + x];
    }

    function getCellCoordinates(cell) {
        const index = Array.from(gridCells).indexOf(cell);
        return {
            x: index % gridSize,
            y: Math.floor(index / gridSize)
        };
    }

    function getDirectionBetween(fromCell, toCell) {
        if (!fromCell || !toCell) return null;
        
        const fromCoords = getCellCoordinates(fromCell);
        const toCoords = getCellCoordinates(toCell);
        
        return {
            x: toCoords.x - fromCoords.x,
            y: toCoords.y - fromCoords.y
        };
    }

    function isCorner(prevCell, currentCell, nextCell) {
        if (!prevCell || !currentCell || !nextCell) return false;
        
        const dir1 = getDirectionBetween(prevCell, currentCell);
        const dir2 = getDirectionBetween(currentCell, nextCell);
        
        return dir1.x !== dir2.x || dir1.y !== dir2.y;
    }

    function getCornerClass(prevCell, currentCell, nextCell) {
        const incomingDir = getDirectionBetween(prevCell, currentCell);
        const outgoingDir = getDirectionBetween(currentCell, nextCell);

        const turnKey = `${incomingDir.x},${incomingDir.y}->${outgoingDir.x},${outgoingDir.y}`;

        const cornerMap = {
            '1,0->0,1': 'snake-corner-right-down',
            '0,-1->-1,0': 'snake-corner-right-down',
            '0,1->1,0': 'snake-corner-left-up',
            '-1,0->0,-1': 'snake-corner-left-up',
            '0,-1->1,0': 'snake-corner-up-right',
            '-1,0->0,1': 'snake-corner-up-right',
            '1,0->0,-1': 'snake-corner-down-right',
            '0,1->-1,0': 'snake-corner-down-right'
        };

        return cornerMap[turnKey] || '';
    }

    // Snake rendering functions
    function clearSnakeClasses(cell) {
        if (!cell) return;
        
        const snakeClasses = [
            'snake', 'snake-horizontal', 'snake-vertical', 'snake-corner',
            'snake-corner-left-up', 'snake-corner-right-down', 
            'snake-corner-up-right', 'snake-corner-down-right'
        ];
        cell.classList.remove(...snakeClasses);
    }

    function updateSnakeSegmentClasses() {
        snake.forEach((cell, index) => {
            if (!cell) return;
            
            clearSnakeClasses(cell);
            cell.classList.add('snake');
            
            let segmentClasses = [];
            
            if (index === 0) {
                // Head segment
                segmentClasses.push(direction.x !== 0 ? 'snake-horizontal' : 'snake-vertical');
            } else if (index === snake.length - 1) {
                // Tail segment
                const prevCell = snake[index - 1];
                const tailDir = getDirectionBetween(prevCell, cell);
                segmentClasses.push(tailDir && tailDir.x !== 0 ? 'snake-horizontal' : 'snake-vertical');
            } else {
                // Body segments
                const prevCell = snake[index - 1];
                const nextCell = snake[index + 1];
                
                if (isCorner(prevCell, cell, nextCell)) {
                    segmentClasses.push('snake-corner');
                    const cornerClass = getCornerClass(prevCell, cell, nextCell);
                    if (cornerClass) segmentClasses.push(cornerClass);
                } else {
                    const dir = getDirectionBetween(prevCell, cell);
                    segmentClasses.push(dir && dir.x !== 0 ? 'snake-horizontal' : 'snake-vertical');
                }
            }
            
            cell.classList.add(...segmentClasses);
        });
    }

    function createSnake() {
        snake.forEach(cell => {
            if (cell) cell.classList.add('snake');
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

    // Game control functions
    function gameOver() {
        gameRunning = false;
        if (gameLoopTimeout) clearTimeout(gameLoopTimeout);
        alert('Game Over! Score: ' + score);
        resetGame();
    }

    function resetGame() {
        gridCells.forEach(cell => {
            clearSnakeClasses(cell);
            cell.classList.remove('apple');
        });

        snake = [getCell(2, 8), getCell(1, 8), getCell(0, 8)];
        direction = { x: 1, y: 0 };
        score = 0;
        updateScore();
        createSnake();
        createFood();
    }

    function getCurrentSpeed() {
        return gameMode === 'manual' ? manualSpeed : automaticSpeed;
    }

    function gameLoop() {
        if (!gameRunning) return;

        const head = snake[0];
        const headCoords = getCellCoordinates(head);

        // Get direction from AI in automatic mode
        if (gameMode === 'automatic' && window.getNextDirection) {
            const nextDir = window.getNextDirection(snake, foodCell, gridSize, gridCells);
            if (nextDir) direction = nextDir;
        }

        // Calculate new head position
        const newHeadX = headCoords.x + direction.x;
        const newHeadY = headCoords.y + direction.y;
        const newHead = getCell(newHeadX, newHeadY);

        // Check collisions
        if (!newHead || newHead.classList.contains('snake')) {
            gameOver();
            return;
        }

        // Move snake
        snake.unshift(newHead);
        newHead.classList.add('snake');

        // Check for food consumption
        if (newHead === foodCell) {
            newHead.classList.remove('apple');
            score++;
            updateScore();
            createFood();
        } else {
            // Remove tail
            const tail = snake.pop();
            clearSnakeClasses(tail);
        }

        updateSnakeSegmentClasses();
        gameLoopTimeout = setTimeout(gameLoop, getCurrentSpeed());
    }

    function startGame() {
        if (!gameRunning) {
            gameRunning = true;
            gameLoop();
        }
    }

    function stopGame() {
        gameRunning = false;
        if (gameLoopTimeout) clearTimeout(gameLoopTimeout);
    }

    // Event listeners
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

    // Initialize game
    createSnake();
    createFood();
    updateScore();
    startGame();

    // Export functions for other modules
    window.setDirection = (newDirection) => {
        if (gameMode === 'manual') direction = newDirection;
    };
    
    window.getDirection = () => direction;
    window.getGameMode = () => gameMode;
    window.getSnake = () => snake;
    window.getFoodCell = () => foodCell;
    window.getGridSize = () => gridSize;
    window.getGridCells = () => gridCells;
});