// Logic/userInputs.js
document.addEventListener('keydown', (e) => {
    // Only process input if in manual mode
    if (window.getGameMode && window.getGameMode() !== 'manual') {
        return;
    }

    const currentDirection = window.getDirection();
    if (!currentDirection) return;

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