// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    'cyan',      // I
    'blue',      // J
    'orange',    // L
    'yellow',    // O
    'green',     // S
    'purple',    // T
    'red'        // Z
];

// Tetris pieces
const PIECES = [
    // I
    [[1, 1, 1, 1]],
    // J
    [[1, 0, 0], [1, 1, 1]],
    // L
    [[0, 0, 1], [1, 1, 1]],
    // O
    [[1, 1], [1, 1]],
    // S
    [[0, 1, 1], [1, 1, 0]],
    // T
    [[0, 1, 0], [1, 1, 1]],
    // Z
    [[1, 1, 0], [0, 1, 1]]
];

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.isGameRunning = false;
        this.isPaused = false;
        this.gameSpeed = 1000 - (this.level - 1) * 100;
        
        this.currentPiece = null;
        this.nextPiece = null;
        this.dropCounter = 0;
        this.lastDropTime = 0;
        
        // Track key states for continuous movement
        this.keysPressed = {};
        
        this.setupEventListeners();
        this.generateNextPiece();
        this.spawnPiece();
    }
    
    createBoard() {
        return Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        
        document.addEventListener('keydown', (e) => {
            if (!this.isGameRunning || this.isPaused) return;
            
            // Track key state
            this.keysPressed[e.key] = true;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.movePiece(-1);
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    this.movePiece(1);
                    e.preventDefault();
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    break;
                case ' ':
                    this.hardDrop();
                    e.preventDefault();
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keysPressed[e.key] = false;
        });
    }
    
    start() {
        if (this.isGameRunning) return;
        
        this.isGameRunning = true;
        this.isPaused = false;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        
        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameSpeed = 1000;
        this.lastDropTime = Date.now();
        
        this.update();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            this.lastDropTime = Date.now();
            this.update();
        }
    }
    
    generateNextPiece() {
        const randomIndex = Math.floor(Math.random() * PIECES.length);
        this.nextPiece = {
            shape: PIECES[randomIndex],
            color: COLORS[randomIndex],
            x: 0,
            y: 0
        };
        this.drawNextPiece();
    }
    
    spawnPiece() {
        this.currentPiece = { ...this.nextPiece };
        this.currentPiece.x = Math.floor(COLS / 2) - Math.floor(this.currentPiece.shape[0].length / 2);
        this.currentPiece.y = 0;
        this.generateNextPiece();
        
        if (this.isColliding()) {
            this.endGame();
        }
    }
    
    isColliding() {
        const piece = this.currentPiece;
        const shape = piece.shape;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = piece.x + col;
                    const y = piece.y + row;
                    
                    if (x < 0 || x >= COLS || y >= ROWS) return true;
                    if (y >= 0 && this.board[y][x]) return true;
                }
            }
        }
        return false;
    }
    
    movePiece(direction) {
        this.currentPiece.x += direction;
        if (this.isColliding()) {
            this.currentPiece.x -= direction;
        }
    }
    
    rotatePiece() {
        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = this.rotateShape(originalShape);
        
        if (this.isColliding()) {
            this.currentPiece.shape = originalShape;
        }
    }
    
    rotateShape(shape) {
        const rotated = [];
        for (let col = 0; col < shape[0].length; col++) {
            const newRow = [];
            for (let row = shape.length - 1; row >= 0; row--) {
                newRow.push(shape[row][col]);
            }
            rotated.push(newRow);
        }
        return rotated;
    }
    
    accelerateDrop() {
        this.dropCounter += 20;
    }
    
    hardDrop() {
        while (!this.isColliding()) {
            this.currentPiece.y++;
        }
        this.currentPiece.y--;
        this.lockPiece();
    }
    
    lockPiece() {
        const piece = this.currentPiece;
        const shape = piece.shape;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = piece.x + col;
                    const y = piece.y + row;
                    
                    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
                        this.board[y][x] = piece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnPiece();
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let row = ROWS - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(COLS).fill(0));
                linesCleared++;
                row++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * linesCleared * 100;
            
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.gameSpeed = Math.max(100, 1000 - (this.level - 1) * 100);
            }
            
            this.updateUI();
        }
    }
    
    update() {
        if (!this.isGameRunning || this.isPaused) return;
        
        const now = Date.now();
        const timeSinceLastDrop = now - this.lastDropTime;
        
        // Check if down arrow is held for continuous fast drop
        let dropSpeed = this.gameSpeed;
        if (this.keysPressed['ArrowDown']) {
            dropSpeed = 50; // Much faster when holding down arrow
        }
        
        if (timeSinceLastDrop + this.dropCounter > dropSpeed) {
            this.currentPiece.y++;
            this.dropCounter = 0;
            this.lastDropTime = now;
            
            if (this.isColliding()) {
                this.currentPiece.y--;
                this.lockPiece();
            }
        }
        
        this.draw();
        requestAnimationFrame(() => this.update());
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 0.5;
        
        for (let row = 0; row <= ROWS; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, row * BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        for (let col = 0; col <= COLS; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * BLOCK_SIZE, 0);
            this.ctx.lineTo(col * BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw board
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (this.board[row][col]) {
                    this.drawBlock(col, row, this.board[row][col]);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece) {
            const piece = this.currentPiece;
            const shape = piece.shape;
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        const x = piece.x + col;
                        const y = piece.y + row;
                        
                        if (y >= 0) {
                            this.drawBlock(x, y, piece.color);
                        }
                    }
                }
            }
        }
    }
    
    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
        
        // Add border for depth
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
    }
    
    drawNextPiece() {
        this.nextCtx.fillStyle = '#f5f5f5';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const piece = this.nextPiece;
        const shape = piece.shape;
        const blockSize = 15;
        const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.nextCtx.fillStyle = piece.color;
                    this.nextCtx.fillRect(
                        offsetX + col * blockSize + 1,
                        offsetY + row * blockSize + 1,
                        blockSize - 2,
                        blockSize - 2
                    );
                    
                    this.nextCtx.strokeStyle = '#fff';
                    this.nextCtx.lineWidth = 1;
                    this.nextCtx.strokeRect(
                        offsetX + col * blockSize + 1,
                        offsetY + row * blockSize + 1,
                        blockSize - 2,
                        blockSize - 2
                    );
                }
            }
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    endGame() {
        this.isGameRunning = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        
        alert(`Game Over!\n\nScore: ${this.score}\nLines: ${this.lines}\nLevel: ${this.level}`);
    }
}

// Initialize game
const game = new Game();
