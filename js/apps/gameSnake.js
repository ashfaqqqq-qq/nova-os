// NovaOS Arcade Game: Cyber Snake
// Smooth canvas-based snake game with 8-bit Web Audio feedback and high score persistence

class SnakeGameApp {
    constructor(container, windowData) {
        this.container = container;
        this.win = windowData;
        this.canvas = null;
        this.ctx = null;
        this.gridSize = 20;
        this.tileCount = 20;

        this.snake = [];
        this.velocity = { x: 0, y: 0 };
        this.food = { x: 5, y: 5 };
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('nova_snake_high') || '0', 10);
        this.gameInterval = null;
        this.isGameOver = false;
        this.isStarted = false;

        this.initUI();
    }

    initUI() {
        this.container.innerHTML = `
            <div class="snake-wrapper">
                <div class="snake-header">
                    <div class="snake-score-box">Score: <span id="snake-score">0</span></div>
                    <div class="snake-score-box high">Best: <span id="snake-high">${this.highScore}</span></div>
                    <button class="snake-btn" id="snake-restart">Restart</button>
                </div>
                <div class="snake-canvas-container">
                    <canvas id="snake-canvas" width="400" height="400"></canvas>
                    <div class="snake-overlay" id="snake-overlay">
                        <div class="snake-msg-title">CYBER SNAKE</div>
                        <div class="snake-msg-sub">Press Arrow Keys or WASD to Start</div>
                    </div>
                </div>
            </div>
        `;

        this.canvas = this.container.querySelector('#snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = this.container.querySelector('#snake-score');
        this.highEl = this.container.querySelector('#snake-high');
        this.overlay = this.container.querySelector('#snake-overlay');

        this.container.querySelector('#snake-restart').addEventListener('click', () => {
            this.resetGame();
        });

        this.keyHandler = (e) => {
            if (!this.win.element.classList.contains('active')) return;
            const key = e.key;

            if (['ArrowUp', 'w', 'W'].includes(key) && this.velocity.y === 0) {
                this.startGame();
                this.velocity = { x: 0, y: -1 };
                e.preventDefault();
            } else if (['ArrowDown', 's', 'S'].includes(key) && this.velocity.y === 0) {
                this.startGame();
                this.velocity = { x: 0, y: 1 };
                e.preventDefault();
            } else if (['ArrowLeft', 'a', 'A'].includes(key) && this.velocity.x === 0) {
                this.startGame();
                this.velocity = { x: -1, y: 0 };
                e.preventDefault();
            } else if (['ArrowRight', 'd', 'D'].includes(key) && this.velocity.x === 0) {
                this.startGame();
                this.velocity = { x: 1, y: 0 };
                e.preventDefault();
            }
        };

        window.addEventListener('keydown', this.keyHandler);

        const originalClose = this.win.onClose;
        this.win.onClose = () => {
            if (this.gameInterval) clearInterval(this.gameInterval);
            window.removeEventListener('keydown', this.keyHandler);
            if (typeof originalClose === 'function') originalClose();
        };

        this.resetGame();
    }

    startGame() {
        if (this.isStarted && !this.isGameOver) return;
        if (this.isGameOver) {
            this.resetGame();
        }
        this.isStarted = true;
        this.isGameOver = false;
        this.overlay.style.display = 'none';

        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.tick(), 110);
    }

    resetGame() {
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.snake = [
            { x: 10, y: 10 },
            { x: 10, y: 11 },
            { x: 10, y: 12 }
        ];
        this.velocity = { x: 0, y: 0 };
        this.score = 0;
        this.scoreEl.textContent = '0';
        this.isGameOver = false;
        this.isStarted = false;
        this.spawnFood();
        this.overlay.style.display = 'flex';
        this.overlay.querySelector('.snake-msg-title').textContent = 'CYBER SNAKE';
        this.overlay.querySelector('.snake-msg-sub').textContent = 'Press Arrow Keys or WASD to Start';
        this.draw();
    }

    spawnFood() {
        this.food = {
            x: Math.floor(Math.random() * this.tileCount),
            y: Math.floor(Math.random() * this.tileCount)
        };
        // Avoid spawning inside snake
        for (const segment of this.snake) {
            if (segment.x === this.food.x && segment.y === this.food.y) {
                return this.spawnFood();
            }
        }
    }

    tick() {
        if (!this.isStarted || this.isGameOver) return;

        const head = {
            x: this.snake[0].x + this.velocity.x,
            y: this.snake[0].y + this.velocity.y
        };

        // Wall collisions
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return this.gameOver();
        }

        // Self collision
        for (const segment of this.snake) {
            if (segment.x === head.x && segment.y === head.y) {
                return this.gameOver();
            }
        }

        this.snake.unshift(head);

        // Food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.scoreEl.textContent = this.score;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.highEl.textContent = this.highScore;
                localStorage.setItem('nova_snake_high', String(this.highScore));
            }
            if (window.soundEngine) {
                window.soundEngine.playBlip(680, 0.08);
            }
            this.spawnFood();
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    gameOver() {
        this.isGameOver = true;
        clearInterval(this.gameInterval);
        if (window.soundEngine) {
            window.soundEngine.playError();
        }
        this.overlay.style.display = 'flex';
        this.overlay.querySelector('.snake-msg-title').textContent = 'GAME OVER';
        this.overlay.querySelector('.snake-msg-sub').textContent = `Score: ${this.score} - Press Arrow Key to Retry`;
    }

    draw() {
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }

        // Draw Food
        this.ctx.fillStyle = '#ff0055';
        this.ctx.shadowColor = '#ff0055';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Draw Snake
        this.snake.forEach((part, index) => {
            const isHead = index === 0;
            this.ctx.fillStyle = isHead ? '#00e5ff' : '#00b0ff';
            if (isHead) {
                this.ctx.shadowColor = '#00e5ff';
                this.ctx.shadowBlur = 8;
            }
            this.ctx.fillRect(
                part.x * this.gridSize + 1,
                part.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
            this.ctx.shadowBlur = 0;
        });
    }
}

window.SnakeGameApp = SnakeGameApp;
