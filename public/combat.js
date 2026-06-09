/**
 * Space Invaders style combat system for GGB OS
 */
const CombatSystem = {
    canvas: null,
    ctx: null,
    width: 300,
    height: 400,
    active: false,
    
    // Game State
    player: { x: 140, y: 360, w: 24, h: 24, speed: 4 },
    bullets: [],
    enemies: [],
    enemyBullets: [],
    score: 0,
    wave: 1,
    gameOver: false,
    shake: 0,
    
    // Controls
    keys: {},
    
    init() {
        const container = document.getElementById('combat-container');
        if (!container) return;

        // Reset state
        this.gameOver = false;
        this.score = 0;
        this.wave = 1;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.player.x = 140;

        container.innerHTML = `
            <div class="combat-ui">
                <div>SCORE: <span id="game-score">0</span></div>
                <div>WAVE: <span id="game-wave">1</span></div>
                <div>HI: <span id="game-hi">${window.state.highScore}</span></div>
            </div>
            <canvas id="combat-canvas" width="300" height="400"></canvas>
            <div class="combat-controls">
                <div class="ctrl-btn" id="btn-left">LEFT</div>
                <div class="ctrl-btn" id="btn-fire">FIRE</div>
                <div class="ctrl-btn" id="btn-right">RIGHT</div>
            </div>
        `;

        this.canvas = document.getElementById('combat-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Input Listeners
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
        
        // Touch events
        const setupTouch = (id, key) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[key] = true; });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; });
        };
        setupTouch('btn-left', 'ArrowLeft');
        setupTouch('btn-right', 'ArrowRight');
        const fireBtn = document.getElementById('btn-fire');
        if (fireBtn) fireBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.shoot(); });
        window.addEventListener('keydown', e => { if (e.code === 'Space') this.shoot(); });

        this.spawnWave();
        this.active = true;
        this.loop();
    },

    spawnWave() {
        const rows = 3;
        const cols = 6;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.enemies.push({
                    x: 30 + c * 40,
                    y: 40 + r * 35,
                    w: 24,
                    h: 24,
                    alive: true,
                    dir: 1,
                    type: r
                });
            }
        }
    },

    shoot() {
        if (this.gameOver) { this.init(); return; }
        if (this.bullets.length < 3) {
            this.bullets.push({ x: this.player.x + 10, y: this.player.y, w: 4, h: 10 });
        }
    },

    update() {
        if (this.gameOver) return;

        // Player movement
        if (this.keys['ArrowLeft'] && this.player.x > 0) this.player.x -= this.player.speed;
        if (this.keys['ArrowRight'] && this.player.x < this.width - this.player.w) this.player.x += this.player.speed;

        // Bullets
        this.bullets.forEach((b, i) => {
            b.y -= 7;
            if (b.y < 0) this.bullets.splice(i, 1);
        });

        // Enemies
        let edge = false;
        let speed = 0.5 + (this.wave * 0.2);
        this.enemies.forEach(e => {
            e.x += speed * e.dir;
            if (e.x <= 0 || e.x >= this.width - e.w) edge = true;
            if (Math.random() < 0.001 * this.wave) {
                this.enemyBullets.push({ x: e.x + 10, y: e.y + 20, w: 4, h: 10 });
            }
        });

        if (edge) {
            this.enemies.forEach(e => {
                e.dir *= -1;
                e.y += 10;
                if (e.y > this.player.y - 20) this.gameOver = true;
            });
        }

        // Enemy Bullets
        this.enemyBullets.forEach((b, i) => {
            b.y += 4;
            if (b.y > this.height) this.enemyBullets.splice(i, 1);
            if (this.rectIntersect(b, this.player)) {
                this.gameOver = true;
                this.shake = 15;
            }
        });

        // Collisions
        this.bullets.forEach((b, bi) => {
            this.enemies.forEach((e, ei) => {
                if (this.rectIntersect(b, e)) {
                    this.enemies.splice(ei, 1);
                    this.bullets.splice(bi, 1);
                    this.score += 100;
                    this.shake = 5;
                    const scoreEl = document.getElementById('game-score');
                    if (scoreEl) scoreEl.textContent = this.score;
                }
            });
        });

        if (this.enemies.length === 0) {
            this.wave++;
            const waveEl = document.getElementById('game-wave');
            if (waveEl) waveEl.textContent = this.wave;
            this.spawnWave();
        }

        if (this.gameOver) {
            if (this.score > window.state.highScore) {
                window.state.highScore = this.score;
                localStorage.setItem('ggb_highscore', this.score);
            }
        }
        
        if (this.shake > 0) this.shake--;
    },

    rectIntersect(r1, r2) {
        return !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y);
    },

    draw() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Screenshake
        if (this.shake > 0) {
            this.ctx.translate(Math.random()*this.shake - this.shake/2, Math.random()*this.shake - this.shake/2);
        }

        // Player
        this.ctx.fillStyle = '#00ffc8';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);

        // Bullets
        this.ctx.fillStyle = '#fff';
        this.bullets.forEach(b => this.ctx.fillRect(b.x, b.y, b.w, b.h));

        // Enemy Bullets
        this.ctx.fillStyle = '#ff3b6b';
        this.enemyBullets.forEach(b => this.ctx.fillRect(b.x, b.y, b.w, b.h));

        // Enemies
        this.enemies.forEach(e => {
            this.ctx.fillStyle = e.type === 0 ? '#ff3b6b' : e.type === 1 ? '#ff00ff' : '#7c3aed';
            this.ctx.fillRect(e.x, e.y, e.w, e.h);
        });

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#ff3b6b';
            this.ctx.font = '20px Orbitron';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CRITICAL FAILURE', this.width/2, this.height/2 - 10);
            this.ctx.font = '10px Share Tech Mono';
            this.ctx.fillText('TAP FIRE TO REBOOT', this.width/2, this.height/2 + 20);
        }

        if (this.shake > 0) this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    },

    loop() {
        if (!this.active) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
};

window.CombatSystem = CombatSystem;
