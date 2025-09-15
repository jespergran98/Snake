const gridContainer = document.querySelector('.grid-container');
const gridSize = 17;

function createGrid() {
    for (let i = 0; i < gridSize * gridSize; i++) {
        const gridCell = document.createElement('div');
        gridCell.classList.add('grid-cell');
        gridContainer.appendChild(gridCell);
    }
}

createGrid();