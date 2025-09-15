// Logic/userInputs.js
document.addEventListener('keydown', (e) => {
    const currentDirection = window.getDirection();

    switch (e.key) {
        case 'ArrowUp':
            if (currentDirection.y !== 1) { // Prevents the snake from reversing on itself
                window.setDirection({ x: 0, y: -1 });
            }
            break;
        case 'ArrowDown':
            if (currentDirection.y !== -1) {
                window.setDirection({ x: 0, y: 1 });
            }
            break;
        case 'ArrowLeft':
            if (currentDirection.x !== 1) {
                window.setDirection({ x: -1, y: 0 });
            }
            break;
        case 'ArrowRight':
            if (currentDirection.x !== -1) {
                window.setDirection({ x: 1, y: 0 });
            }
            break;
    }
});