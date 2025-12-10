// game.js
// constants
const TILE_SIZE = 32;
const ROWS = 15;
const COLS = 19;

const WALL_COLOR = "blue";
const DOT_COLOR = "white";
const PACMAN_COLOR = "yellow";
const GHOST_COLOR = "red";
const BG_COLOR = "black";

const STEP_TIME = 150;        // pacman step time
const GHOST_STEP_TIME = 300;  // slower ghost step time

// map
// W = wall, . = dot, ' ' = empty, P = pacman start
let levelMap = [
    "WWWWWWWWWWWWWWWWWWW",
    "W........W........W",
    "W.WWWW.W.W.W.WWWW.W",
    "W.W  W.W...W.W  W.W",
    "W.WWWW.W   W.WWWW.W",
    "W.................W",
    "WWWWW.WWW WWW.WWWWW",
    "         P         ",
    "WWWWW.WWWWWWW.WWWWW",
    "W........W........W",
    "W.WWWW.W.W.W.WWWW.W",
    "W... W.W...W.W ...W",
    "W.WWWW.W.W.W.WWWW.W",
    "W.................W",
    "WWWWWWWWWWWWWWWWWWW",
];

// pacman initial position and direction
let pacmanRow = 0;
let pacmanCol = 0;
let pacmanDir = { dx: 0, dy: 0 }; // current direction

// find the P in the map
for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
        if (levelMap[r][c] === "P") {
            pacmanRow = r;
            pacmanCol = c;
        }
    }
}

// replace P with empty space
levelMap = levelMap.map(row => row.replace("P", " "));

// one ghost
// important: different position than pacman!
let ghost = {
    row: 7,   // same row
    col: 5,   // but different column, not 9
    dx: 0,
    dy: -1
};

let gameOver = false;
let win = false;

// canvas
const canvas = document.getElementById("gameCanvas");
canvas.width = COLS * TILE_SIZE;
canvas.height = ROWS * TILE_SIZE;
const ctx = canvas.getContext("2d");

// helper: wall detection
function isWall(row, col) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
        return true;
    }
    return levelMap[row][col] === "W";
}

// eat dot
function eatDot(row, col) {
    const rowStr = levelMap[row];
    if (rowStr[col] === ".") {
        levelMap[row] = rowStr.slice(0, col) + " " + rowStr.slice(col + 1);
    }
}

// get valid directions for ghost
const DIRECTIONS = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
];

function validDirections(row, col) {
    return DIRECTIONS.filter(dir => !isWall(row + dir.dy, col + dir.dx));
}

// map drawing
function drawLevel() {
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
        const row = levelMap[r];
        for (let c = 0; c < COLS; c++) {
            const cell = row[c];
            const x = c * TILE_SIZE;
            const y = r * TILE_SIZE;

            if (cell === "W") {
                ctx.fillStyle = WALL_COLOR;
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            } else if (cell === ".") {
                ctx.fillStyle = DOT_COLOR;
                ctx.beginPath();
                ctx.arc(
                    x + TILE_SIZE / 2,
                    y + TILE_SIZE / 2,
                    3,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
    }
}

// draw pacman
function drawPacman() {
    const px = pacmanCol * TILE_SIZE + TILE_SIZE / 2;
    const py = pacmanRow * TILE_SIZE + TILE_SIZE / 2;

    ctx.fillStyle = PACMAN_COLOR;
    ctx.beginPath();
    ctx.arc(px, py, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
}

// draw ghost
function drawGhost() {
    const gx = ghost.col * TILE_SIZE + TILE_SIZE / 2;
    const gy = ghost.row * TILE_SIZE + TILE_SIZE / 2;

    ctx.fillStyle = GHOST_COLOR;
    ctx.beginPath();
    ctx.arc(gx, gy, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
}

// draw everything
function draw() {
    drawLevel();
    drawPacman();
    drawGhost();

    if (gameOver) {
        ctx.fillStyle = "white";
        ctx.font = "48px Arial";
        ctx.textAlign = "center";
        
        if (win) {
            ctx.fillText("YOU WIN!", canvas.width / 2, canvas.height / 2);
        } else {
            ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        }
    }

}

// pacman update
function updatePacman() {
    // if no direction, do nothing
    if (pacmanDir.dx === 0 && pacmanDir.dy === 0) return;

    let newRow = pacmanRow + pacmanDir.dy;
    let newCol = pacmanCol + pacmanDir.dx;

    // move through the tunnel
    if (newCol < 0) newCol = COLS - 1;
    else if (newCol >= COLS) newCol = 0;

    if (!isWall(newRow, newCol)) {
        pacmanRow = newRow;
        pacmanCol = newCol;
        eatDot(pacmanRow, pacmanCol);
    }
}

// ghost update
function updateGhost() {
    const options = validDirections(ghost.row, ghost.col);
    if (options.length === 0) return;

    let choices = options;
    const opposite = { dx: -ghost.dx, dy: -ghost.dy };

    if (choices.length > 1) {
        choices = choices.filter(
            d => !(d.dx === opposite.dx && d.dy === opposite.dy)
        );
        if (choices.length === 0) {
            choices = options;
        }
    }

    let bestDir = choices[0];
    let bestDist = Infinity;

    for (const dir of choices) {
        let newRow = ghost.row + dir.dy;
        let newCol = ghost.col + dir.dx;

        // ghost tunnel wraparound
        if (newCol < 0) newCol = COLS - 1;
        else if (newCol >= COLS) newCol = 0;

        if (isWall(newRow, newCol)) continue;

        const dist = Math.abs(newRow - pacmanRow) + Math.abs(newCol - pacmanCol);
        if (dist < bestDist) {
            bestDist = dist;
            bestDir = { dx: dir.dx, dy: dir.dy };
        }
    }

    ghost.dx = bestDir.dx;
    ghost.dy = bestDir.dy;

    let nextRow = ghost.row + ghost.dy;
    let nextCol = ghost.col + ghost.dx;

    if (nextCol < 0) nextCol = COLS - 1;
    else if (nextCol >= COLS) nextCol = 0;

    if (!isWall(nextRow, nextCol)) {
        ghost.row = nextRow;
        ghost.col = nextCol;
    }
}

// collision detection
function checkCollision() {
    if (ghost.row === pacmanRow && ghost.col === pacmanCol) {
        gameOver = true;
        pacmanDir = { dx: 0, dy: 0 };
    }
}

function checkWinCondition() {
    for (let r = 0; r < ROWS; r++) {
        if (levelMap[r].includes(".")) {
            return false; // there are still dots
        }
    }
    return true; // all dots eaten, victory
}

// game loop, pacman and ghost at different speeds
let lastTime = 0;
let pacmanAcc = 0;
let ghostAcc = 0;

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    // if game over, stop updating
    if (gameOver) {
        draw();
        return;
    }

    pacmanAcc += delta;
    ghostAcc += delta;

    if (pacmanAcc >= STEP_TIME) {
        updatePacman();
        pacmanAcc -= STEP_TIME;
    }

    if (ghostAcc >= GHOST_STEP_TIME) {
        updateGhost();
        ghostAcc -= GHOST_STEP_TIME;
    }

    checkCollision();
    if (checkWinCondition()) {
        gameOver = true;
        win = true;
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// keyboard input, arrow keys to control pacman
document.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "ArrowUp":
            pacmanDir = { dx: 0, dy: -1 };
            break;
        case "ArrowDown":
            pacmanDir = { dx: 0, dy: 1 };
            break;
        case "ArrowLeft":
            pacmanDir = { dx: -1, dy: 0 };
            break;
        case "ArrowRight":
            pacmanDir = { dx: 1, dy: 0 };
            break;
    }
});

// start the game loop
draw();
requestAnimationFrame(gameLoop);
