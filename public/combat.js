const CombatSystem = {
    state: {
        active: false,
        player: { x: 150, y: 350, w: 30, h: 30, bullets: [], speed: 4, lastShot: 0 },
        enemies: [],
        enemyBullets: [],
        particles: [],
        wave: 1,
        score: 0,
        highScore: parseInt(localStorage.getItem('ggb_high_score') || '0'),
        screenshake: 0,
        assets: { player: null, enemy: null }
    },

    init() {
        if (this.state.active) return;
        console.log("Combat system initializing...");
        this.setupLayout();
        this.loadAssets();
        this.resetGame();
        this.state.active = true;
        this.loop();
    },

    setupLayout() {
        const container = document.getElementById('combat-container');
        if (!container) return;

        container.innerHTML = `
            <div class="panel" style="padding: 10px; border-color: #ff3b6b; position: relative; overflow: hidden;">
                <div style="display: flex; justify-content: space-between; font-family: Orbitron; font-size: 10px; margin-bottom: 5px;">
                    <div id="combat-score">SCORE: 0000</div>
                    <div id="combat-wave">WAVE: 1</div>
                    <div id="combat-high">BEST: ${this.state.highScore.toString().padStart(4, '0')}</div>
                </div>
                
                <div style="position: relative; width: 100%; aspect-ratio: 3/4; background: #000; border: 1px solid #ff3b6b; overflow: hidden;">
                    <canvas id="combat-canvas" width="300" height="400" style="width: 100%; height: 100%; image-rendering: pixelated;"></canvas>
                    <div id="combat-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; text-align: center; display: none;">
                        <div>
                            <div style="font-family: Orbitron; color: #ff3b6b; font-size: 20px; margin-bottom: 10px;">SIGNAL LOST</div>
                            <button class="btn" onclick="CombatSystem.resetGame()">REBOOT</button>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 15px;">
                    <button id="btn-left" class="btn" style="padding: 20px 0; touch-action: none;">LEFT</button>
                    <button id="btn-fire" class="btn" style="padding: 20px 0; border-color: #ff3b6b; color: #ff3b6b; touch-action: none;">FIRE</button>
                    <button id="btn-right" class="btn" style="padding: 20px 0; touch-action: none;">RIGHT</button>
                </div>
            </div>
        `;

        this.canvas = document.getElementById('combat-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('combat-overlay');

        // Input handling
        this.keys = {};
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        const setupTouch = (id, key) => {
            const btn = document.getElementById(id);
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[key] = true; });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; });
        };
        setupTouch('btn-left', 'ArrowLeft');
        setupTouch('btn-right', 'ArrowRight');
        setupTouch('btn-fire', 'Space');
    },

    loadAssets() {
        this.state.assets.player = new Image();
        this.state.assets.player.src = (window.state && window.state.selectedNft) ? window.state.selectedNft.image : 'https://ipfs.io/ipfs/QmZ8nyVf4XvK6mZqLpC3P1pXN3zYJ5GzW1R1vX7p6N3zYJ';
        
        this.state.assets.enemy = new Image();
        this.state.assets.enemy.src = 'https://ipfs.io/ipfs/QmXyN3zYJ5GzW1R1vX7p6N3zYJ5GzW1R1vX7p6N3zYJ';
    },

    resetGame() {
        this.state.player.x = 135;
        this.state.player.bullets = [];
        this.state.enemies = [];
        this.state.enemyBullets = [];
        this.state.particles = [];
        this.state.wave = 1;
        this.state.score = 0;
        this.state.active = true;
        this.overlay.style.display = 'none';
        this.spawnWave();
    },

    spawnWave() {
        const rows = 3;
        const cols = 6;
        const spacing = 40;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.state.enemies.push({
                    x: 30 + c * spacing,
                    y: 40 + r * spacing,
                    w: 25,
                    h: 25,
                    hp: 1,
                    type: 'mutant'
                });
            }
        }
    },

    update() {
        if (!this.state.active) return;

        // Player movement
        if (this.keys['ArrowLeft'] && this.state.player.x > 0) this.state.player.x -= this.state.player.speed;
        if (this.keys['ArrowRight'] && this.state.player.x < 300 - this.state.player.w) this.state.player.x += this.state.player.speed;
        
        // Shooting
        const now = Date.now();
        if (this.keys['Space'] && now - this.state.player.lastShot > 250) {
            this.state.player.bullets.push({ x: this.state.player.x + 13, y: this.state.player.y, speed: 6 });
            this.state.player.lastShot = now;
        }

        // Bullet update
        this.state.player.bullets.forEach((b, i) => {
            b.y -= b.speed;
            if (b.y < -10) this.state.player.bullets.splice(i, 1);
        });

        // Enemy movement & shooting
        let shiftDown = false;
        const enemySpeed = 1 + (this.state.wave * 0.2);
        this.state.enemies.forEach(e => {
            e.x += enemySpeed * (this.state.waveDir || 1);
            if (e.x > 275 || e.x < 0) shiftDown = true;
            
            if (Math.random() < 0.005 * this.state.wave) {
                this.state.enemyBullets.push({ x: e.x + 10, y: e.y + 20, speed: 3 });
            }
        });

        if (shiftDown) {
            this.state.waveDir = (this.state.waveDir || 1) * -1;
            this.state.enemies.forEach(e => {
                e.y += 10;
                if (e.y > 340) this.gameOver();
            });
        }

        // Enemy bullets
        this.state.enemyBullets.forEach((b, i) => {
            b.y += b.speed;
            if (b.y > 400) this.state.enemyBullets.splice(i, 1);
            
            // Collision with player
            if (b.x > this.state.player.x && b.x < this.state.player.x + this.state.player.w &&
                b.y > this.state.player.y && b.y < this.state.player.y + this.state.player.h) {
                this.gameOver();
            }
        });

        // Collision detection
        this.state.player.bullets.forEach((b, bi) => {
            this.state.enemies.forEach((e, ei) => {
                if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
                    this.state.player.bullets.splice(bi, 1);
                    this.state.enemies.splice(ei, 1);
                    this.state.score += 100;
                    this.createExplosion(e.x + 12, e.y + 12, '#00ffc8');
                    this.state.screenshake = 5;
                }
            });
        });

        // Particles
        this.state.particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) this.state.particles.splice(i, 1);
        });

        if (this.state.enemies.length === 0) {
            this.state.wave++;
            this.spawnWave();
        }

        if (this.state.screenshake > 0) this.state.screenshake *= 0.9;
        
        // Update UI
        document.getElementById('combat-score').textContent = `SCORE: ${this.state.score.toString().padStart(4, '0')}`;
        document.getElementById('combat-wave').textContent = `WAVE: ${this.state.wave}`;
    },

    createExplosion(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.state.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                color
            });
        }
    },

    gameOver() {
        this.state.active = false;
        this.overlay.style.display = 'flex';
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            localStorage.setItem('ggb_high_score', this.state.highScore);
            document.getElementById('combat-high').textContent = `BEST: ${this.state.highScore.toString().padStart(4, '0')}`;
        }
    },

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, 300, 400);

        this.ctx.save();
        if (this.state.screenshake > 0.5) {
            this.ctx.translate((Math.random() - 0.5) * this.state.screenshake, (Math.random() - 0.5) * this.state.screenshake);
        }

        // Draw player
        if (this.state.assets.player.complete) {
            this.ctx.drawImage(this.state.assets.player, this.state.player.x, this.state.player.y, 30, 30);
        } else {
            this.ctx.fillStyle = '#00ffc8';
            this.ctx.fillRect(this.state.player.x, this.state.player.y, 30, 30);
        }

        // Draw enemies
        this.state.enemies.forEach(e => {
            if (this.state.assets.enemy.complete) {
                this.ctx.drawImage(this.state.assets.enemy, e.x, e.y, 25, 25);
            } else {
                this.ctx.fillStyle = '#ff3b6b';
                this.ctx.fillRect(e.x, e.y, 25, 25);
            }
        });

        // Draw bullets
        this.ctx.fillStyle = '#00ffc8';
        this.state.player.bullets.forEach(b => this.ctx.fillRect(b.x, b.y, 3, 10));
        
        this.ctx.fillStyle = '#ff3b6b';
        this.state.enemyBullets.forEach(b => this.ctx.fillRect(b.x, b.y, 3, 10));

        // Draw particles
        this.state.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, 2, 2);
        });
        this.ctx.globalAlpha = 1;

        this.ctx.restore();
    },

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
};

window.CombatSystem = CombatSystem;
