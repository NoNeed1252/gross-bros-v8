const CombatSystem = {
    state: {
        active: false,
        score: 0,
        highScore: localStorage.getItem('ggb_high_score') || 0,
        wave: 1,
        player: { x: 145, y: 350, w: 30, h: 30, speed: 5 },
        bullets: [],
        enemies: [],
        enemyBullets: [],
        particles: [],
        keys: {},
        lastFire: 0,
        shake: 0,
        gameOver: false,
        playerImage: null,
        enemyImage: null
    },

    sprites: {
        player: [
            [0,0,0,0,0,4,4,0,0,0,0,0],
            [0,0,0,0,1,4,4,1,0,0,0,0],
            [0,0,1,1,2,2,1,1,0,0,0],
            [0,0,1,1,2,3,3,2,1,1,0,0],
            [0,1,1,2,3,4,4,3,2,1,1,0],
            [0,1,2,2,4,4,4,4,2,2,1,0],
            [1,1,2,2,2,2,2,2,2,2,1,1],
            [1,2,1,1,1,2,2,1,1,1,2,1],
            [1,2,1,0,1,1,1,1,0,1,2,1],
            [1,1,0,0,1,3,3,1,0,0,1,1],
            [1,0,0,0,3,4,4,3,0,0,0,1],
            [4,0,0,0,4,0,0,4,0,0,0,4]
        ],
        enemySpore: [
            [0,0,0,1,1,1,1,0,0,0],
            [0,1,1,3,3,3,3,1,1,0],
            [0,1,3,4,4,4,4,3,1,0],
            [1,3,4,2,2,2,2,4,3,1],
            [1,3,4,2,3,3,2,4,3,1],
            [1,3,4,2,2,2,2,4,3,1],
            [0,1,3,4,4,4,4,3,1,0],
            [0,1,1,3,3,3,3,1,1,0],
            [0,0,1,1,0,0,1,1,0,0],
            [0,1,1,0,0,0,0,1,1,0]
        ],
        enemyAcid: [
            [0,0,1,0,0,0,0,1,0,0],
            [0,1,1,1,0,0,1,1,1,0],
            [1,1,3,3,1,1,3,3,1,1],
            [1,3,4,4,3,3,4,4,3,1],
            [1,3,4,1,1,1,1,4,3,1],
            [1,1,1,1,1,1,1,1,1,1],
            [0,1,3,3,3,3,3,3,1,0],
            [0,0,1,4,4,4,4,1,0,0],
            [0,1,1,0,0,0,0,1,1,0],
            [1,1,0,0,0,0,0,0,1,1]
        ]
    },

    colors: {
        player: { 1: '#00ffc8', 2: '#061a15', 3: '#39ff14', 4: '#ff3b6b' },
        enemySpore: { 1: '#39ff14', 2: '#0c3d18', 3: '#ccff00', 4: '#ff3b6b' },
        enemyAcid: { 1: '#ffaa00', 2: '#3d2800', 3: '#ccff00', 4: '#ff3b6b' }
    },

    init() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.lastTimestamp = 0;
        this.state.active = false;
        this.state.gameOver = false;
        this.state.score = 0;
        this.state.wave = 1;
        this.state.bullets = [];
        this.state.enemies = [];
        this.state.enemyBullets = [];
        this.state.particles = [];
        
        this.renderLayout();
        this.setupCanvas();
        this.setupControls();
        this.initWave();
        
        this.loopBound = this.loop.bind(this);
        this.animationId = requestAnimationFrame(this.loopBound);
    },

    renderLayout() {
        const container = document.getElementById('game-room-container');
        if (!container) return;
        container.innerHTML = `
            <div class="panel" style="border-color: var(--cyan); display: flex; flex-direction: column; align-items: center; position: relative; overflow: hidden; padding: 10px; max-width: 320px; margin: 0 auto;">
                <div style="width: 100%; display: flex; justify-content: space-between; font-family: Orbitron; font-size: 12px; margin-bottom: 10px;">
                    <div>SCORE: <span id="game-score">0</span></div>
                    <div>WAVE: <span id="game-wave">1</span></div>
                    <div>HI: <span id="game-hi">\${this.state.highScore}</span></div>
                </div>
                <div id="canvas-wrapper" style="position: relative; width: 300px; height: 400px; background: #000; border: 2px solid rgba(0,255,200,0.2); border-radius: 8px; overflow: hidden;">
                    <canvas id="game-room-canvas" width="300" height="400" style="width: 100%; height: 100%; display: block;"></canvas>
                    <div id="game-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,0.7); z-index: 10;">
                        <h2 id="overlay-title" style="font-family: Orbitron; color: var(--cyan); margin-bottom: 20px;">READY?</h2>
                        <button class="btn" onclick="CombatSystem.startGame()" style="padding: 15px 40px; font-size: 18px;">START</button>
                    </div>
                </div>
                <div class="mobile-controls" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; width: 100%; max-width: 300px; margin-top: 15px;">
                    <button class="btn" id="ctrl-left" style="height: 60px; font-size: 24px; touch-action: manipulation;">←</button>
                    <button class="btn" id="ctrl-fire" style="height: 60px; font-size: 20px; border-color: #ff3b6b; color: #ff3b6b; touch-action: manipulation;">FIRE</button>
                    <button class="btn" id="ctrl-right" style="height: 60px; font-size: 24px; touch-action: manipulation;">→</button>
                </div>
                <div style="margin-top: 10px; font-size: 10px; opacity: 0.5;">ARROWS + SPACE FOR DESKTOP</div>
            </div>
        `;
    },

    setupCanvas() {
        this.canvas = document.getElementById('game-room-canvas');
        if (this.canvas) this.ctx = this.canvas.getContext('2d');
    },

    setupControls() {
        window.onkeydown = (e) => { this.state.keys[e.code] = true; };
        window.onkeyup = (e) => { this.state.keys[e.code] = false; };
        const bindBtn = (id, key) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.state.keys[key] = true; }, {passive: false});
            btn.addEventListener('touchend', (e) => { e.preventDefault(); this.state.keys[key] = false; }, {passive: false});
            btn.addEventListener('mousedown', () => { this.state.keys[key] = true; });
            btn.addEventListener('mouseup', () => { this.state.keys[key] = false; });
            btn.addEventListener('mouseleave', () => { this.state.keys[key] = false; });
        };
        bindBtn('ctrl-left', 'ArrowLeft');
        bindBtn('ctrl-right', 'ArrowRight');
        bindBtn('ctrl-fire', 'Space');
    },

    startGame() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.lastTimestamp = 0;
        this.state.active = true;
        this.state.gameOver = false;
        this.state.score = 0;
        this.state.wave = 1;
        this.state.bullets = [];
        this.state.enemyBullets = [];
        this.state.particles = [];
        this.state.player.x = 150 - this.state.player.w/2;
        this.initWave();
        const overlay = document.getElementById('game-overlay');
        if (overlay) overlay.style.display = 'none';
        const scoreEl = document.getElementById('game-score');
        if (scoreEl) scoreEl.textContent = '0';
        const waveEl = document.getElementById('game-wave');
        if (waveEl) waveEl.textContent = '1';
        this.animationId = requestAnimationFrame(this.loopBound);
    },

    initWave() {
        this.state.enemies = [];
        const rows = 3, cols = 5, padding = 10, width = 30, height = 30;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const type = (r % 2 === 0) ? 'enemySpore' : 'enemyAcid';
                this.state.enemies.push({
                    x: c * (width + padding) + 50, y: r * (height + padding) + 50,
                    w: width, h: height, type: type, hp: 1, direction: 1,
                    speed: 1 + (this.state.wave * 0.2)
                });
            }
        }
    },

    spawnExplosion(x, y, color) {
        for (let i = 0; i < 15; i++) {
            this.state.particles.push({
                x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
                life: 1.0, color: color || 'var(--cyan)'
            });
        }
        this.state.shake = 10;
    },

    loop(timestamp) {
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        let dt = (timestamp - this.lastTimestamp) / 16.67;
        dt = Math.min(dt, 2.0);
        this.lastTimestamp = timestamp;
        this.update(dt);
        this.draw();
        this.animationId = requestAnimationFrame(this.loopBound);
    },

    update(dt = 1) {
        if (!this.state.active || this.state.gameOver) return;
        if (this.state.keys['ArrowLeft'] && this.state.player.x > 0) this.state.player.x -= this.state.player.speed * dt;
        if (this.state.keys['ArrowRight'] && this.state.player.x < 300 - this.state.player.w) this.state.player.x += this.state.player.speed * dt;
        const now = Date.now();
        if ((this.state.keys['Space'] || this.state.keys['KeyF']) && now - this.state.lastFire > 250) {
            this.state.bullets.push({ x: this.state.player.x + this.state.player.w / 2 - 2, y: this.state.player.y, w: 4, h: 10, speed: 7 });
            this.state.lastFire = now;
        }
        this.state.bullets = this.state.bullets.filter(b => { b.y -= b.speed * dt; return b.y > -20; });
        this.state.enemyBullets = this.state.enemyBullets.filter(b => { b.y += b.speed * dt; return b.y < 420; });
        let edgeHit = false;
        this.state.enemies.forEach(e => {
            e.x += e.direction * e.speed * dt;
            if (e.x <= 0 || e.x >= 300 - e.w) edgeHit = true;
            if (Math.random() < (0.005 * this.state.wave * dt)) {
                this.state.enemyBullets.push({ x: e.x + e.w/2, y: e.y + e.h, w: 4, h: 10, speed: 3 + this.state.wave/2 });
            }
        });
        if (edgeHit) {
            this.state.enemies.forEach(e => {
                e.direction *= -1;
                e.y += 10;
                if (e.y > 350) this.endGame();
            });
        }
        this.state.bullets.forEach((b, bi) => {
            this.state.enemies.forEach((e, ei) => {
                if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
                    this.state.bullets.splice(bi, 1);
                    this.state.enemies.splice(ei, 1);
                    this.state.score += 100;
                    const scoreEl = document.getElementById('game-score');
                    if (scoreEl) scoreEl.textContent = this.state.score;
                    const splashColor = (e.type === 'enemySpore') ? '#39ff14' : '#ffaa00';
                    this.spawnExplosion(e.x + e.w/2, e.y + e.h/2, splashColor);
                    if (this.state.enemies.length === 0) {
                        this.state.wave++;
                        const waveEl = document.getElementById('game-wave');
                        if (waveEl) waveEl.textContent = this.state.wave;
                        this.initWave();
                    }
                }
            });
        });
        this.state.enemyBullets.forEach((b, bi) => {
            const p = this.state.player;
            if (b.x < p.x + p.w && b.x + b.w > p.x && b.y < p.y + p.h && b.y + b.h > p.y) this.endGame();
        });
        this.state.particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= 0.02 * dt; });
        this.state.particles = this.state.particles.filter(p => p.life > 0);
        if (this.state.shake > 0) this.state.shake--;
    },

    endGame() {
        this.state.active = false;
        this.state.gameOver = true;
        this.spawnExplosion(this.state.player.x + 15, this.state.player.y + 15, 'var(--cyan)');
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            localStorage.setItem('ggb_high_score', this.state.highScore);
            const hiEl = document.getElementById('game-hi');
            if (hiEl) hiEl.textContent = this.state.highScore;
        }
        const overlay = document.getElementById('game-overlay');
        const title = document.getElementById('overlay-title');
        if (overlay) {
            overlay.style.display = 'flex';
            if (title) { title.textContent = 'LINK SEVERED'; title.style.color = '#ff3b6b'; }
        }
    },

    drawPixelArt(ctx, x, y, w, h, matrix, colors) {
        const rows = matrix.length, cols = matrix[0].length, pxW = w / cols, pxH = h / rows;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const val = matrix[r][c];
                if (val > 0) {
                    ctx.fillStyle = colors[val] || '#fff';
                    ctx.fillRect(x + c * pxW - 0.2, y + r * pxH - 0.2, pxW + 0.4, pxH + 0.4);
                }
            }
        }
    },

    draw() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        ctx.save();
        if (this.state.shake > 0) ctx.translate((Math.random()-0.5)*this.state.shake, (Math.random()-0.5)*this.state.shake);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(0, 0, 300, 400);
        ctx.strokeStyle = 'rgba(0,255,200,0.03)';
        for(let i=0; i<300; i+=20) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,400); ctx.stroke(); }
        for(let i=0; i<400; i+=20) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(300,i); ctx.stroke(); }
        this.drawPixelArt(ctx, this.state.player.x, this.state.player.y, this.state.player.w, this.state.player.h, this.sprites.player, this.colors.player);
        this.state.enemies.forEach(e => this.drawPixelArt(ctx, e.x, e.y, e.w, e.h, this.sprites[e.type], this.colors[e.type]));
        ctx.save();
        if (window.devicePixelRatio < 2) ctx.shadowBlur = 6;
        ctx.shadowColor = 'var(--cyan)'; ctx.fillStyle = 'var(--cyan)';
        this.state.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
        ctx.shadowColor = '#ff3b6b'; ctx.fillStyle = '#ff3b6b';
        this.state.enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
        ctx.restore();
        this.state.particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 2, 2); });
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.lineWidth = 1;
        const step = window.devicePixelRatio > 1 ? 8 : 4;
        for (let y = 0; y < 400; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(300, y); ctx.stroke(); }
        const flicker = Math.random() * 0.03 + 0.97;
        ctx.fillStyle = 'rgba(0, 255, 200, 0.02)'; ctx.globalAlpha = flicker;
        ctx.fillRect(0, 0, 300, 400);
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }
};
window.CombatSystem = CombatSystem;