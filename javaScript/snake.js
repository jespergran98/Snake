document.addEventListener('DOMContentLoaded', () => {
    const gridCells = document.querySelectorAll('.grid-cell');
    const gridSize = 17;

    let snake = [
        getCell(8, 8),
        getCell(7, 8),
        getCell(6, 8)
    ];
    let direction = { x: 1, y: 0 };
    let snakeSpeed = 100;
    let foodCell;
    let score = 0;

    function getCell(x, y) {
        // Ensure coordinates wrap around the grid
        const wrappedX = (x + gridSize) % gridSize;
        const wrappedY = (y + gridSize) % gridSize;
        return gridCells[wrappedY * gridSize + wrappedX];
    }

    function createSnake() {
        snake.forEach(cell => {
            cell.classList.add('snake');
        });
    }

    function createFood() {
        let newFoodCell;
        do {
            const randomIndex = Math.floor(Math.random() * gridSize * gridSize);
            newFoodCell = gridCells[randomIndex];
        } while (newFoodCell.classList.contains('snake'));
        
        foodCell = newFoodCell;
        foodCell.classList.add('apple');
    }

    function gameLoop() {
        // Get the current head position
        const head = snake[0];
        const headIndex = Array.from(gridCells).indexOf(head);
        const headX = headIndex % gridSize;
        const headY = Math.floor(headIndex / gridSize);
        
        // Calculate the new head position
        const newHeadX = headX + direction.x;
        const newHeadY = headY + direction.y;

        // Get the new head cell
        const newHead = getCell(newHeadX, newHeadY);

        // Check for collision with self
        if (newHead.classList.contains('snake')) {
            alert('Game Over! Score: ' + score);
            location.reload();
            return;
        }

        // Add the new head to the snake
        snake.unshift(newHead);
        newHead.classList.add('snake');

        // Check if the new head is on an apple
        if (newHead === foodCell) {
            newHead.classList.remove('apple');
            score++;
            createFood();
        } else {
            // Remove the tail if no food was eaten
            const tail = snake.pop();
            tail.classList.remove('snake');
        }

        setTimeout(gameLoop, snakeSpeed);
    }

    // Set up the initial game state
    createSnake();
    createFood();
    gameLoop();

    // Expose the direction setters/getters
    window.setDirection = (newDirection) => {
        direction = newDirection;
    };
    window.getDirection = () => direction;
});