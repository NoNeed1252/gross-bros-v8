/**
 * GROSS BROS: TACTICAL SECTOR CONTROL & MINING SIMULATOR
 * Mobile-responsive, high-fidelity tactical sector interface.
 */

const CombatSystem = {
    state: {
        view: 'sector', // 'sector', 'combat', 'mining'
        active: false,
        score: 0,
        highScore: localStorage.getItem('ggb_high_score') || 0,
        wave: 1,
        player: { x: 145, y: 350, w: 40, h: 40, speed: 6 },
        bullets: [],
        enemies: [],
        enemyBullets: [],
        particles: [],
        keys: {},
        lastFire: 0,
        shake: 0,
        gameOver: false,
        playerImage: null,
        miningState: {
            drillRotation: 0,
            depth: 0,
            bertCollected: 0,
            dropCollected: 0,
            isDrilling: false
        }
    },

    init() {
        console.log('[CombatSystem] Initializing tactical uplink...');
        this.renderSectorMap();
        this.preloadAssets();
    },

    preloadAssets() {
        // Fallback or Active Gross Bro NFT
        const nftUrl = (window.state && window.state.selectedNft && window.state.selectedNft.image) 
                     ? window.state.selectedNft.image 
                     : 'https://grossbros.xyz/api/placeholder/40/40'; // Fallback
        
        this.state.playerImage = new Image();
        this.state.playerImage.src = nftUrl;
        this.state.playerImage.onerror = () => {
            console.log('[Operator] Failed to load NFT image, using fallback.');
            this.state.playerImage.src = 'https://www.placehold.it/40x40/00ffc8/000000?text=BRO';
        };
    },

    renderSectorMap() {
        const container = document.getElementById('game-room-container');
        if (!container) return;

        this.state.view = 'sector';
        
        container.innerHTML = `
            <div style="width: 100%; max-width: 800px; margin: 0 auto; font-family: 'Orbitron', sans-serif; color: #fff; padding: 10px;">
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- HEADER -->
                    <div class="panel" style="border-color: var(--cyan); padding: 10px; display: flex; justify-content: space-between; align-items: center; background: rgba(0,255,200,0.05);">
                        <div style="font-size: 14px; color: var(--cyan);">TACTICAL SECTOR MAP</div>
                        <div style="font-size: 12px; opacity: 0.8;">OPERATOR: ALPHA</div>
                    </div>

                    <!-- DUAL CARDS -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                        
                        <!-- CARD 1: NEURAL COMBAT -->
                        <div class="panel" style="border-color: #ff3b6b; padding: 0; overflow: hidden; display: flex; flex-direction: column;">
                            <div style="height: 180px; background: url('/assets/neural-combat-preview.png') center/cover no-repeat; position: relative;">
                                <div style="position: absolute; top: 10px; left: 10px; background: rgba(255,59,107,0.8); padding: 2px 8px; font-size: 10px; border-radius: 2px;">THREAT LEVEL: CRITICAL</div>
                            </div>
                            <div style="padding: 15px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                                <div>
                                    <h3 style="margin: 0 0 10px 0; color: #ff3b6b; letter-spacing: 2px;">NEURAL COMBAT</h3>
                                    <p style="font-size: 12px; line-height: 1.4; opacity: 0.7; margin-bottom: 20px;">
                                        Hostile data spores detected in the neural buffer. Engage defensive protocols using your synchronized Bro-Link.
                                    </p>
                                </div>
                                <button class="btn" onclick="CombatSystem.startCombat()" style="border-color: #ff3b6b; color: #ff3b6b; width: 100%; padding: 12px;">LAUNCH SIMULATOR</button>
                            </div>
                        </div>

                        <!-- CARD 2: XRP-7 MINING -->
                        <div class="panel" style="border-color: var(--cyan); padding: 0; overflow: hidden; display: flex; flex-direction: column;">
                            <div style="height: 180px; background: url('/assets/xrp7-mining-preview.png') center/cover no-repeat; position: relative;">
                                <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,255,200,0.8); padding: 2px 8px; font-size: 10px; border-radius: 2px; color: #000;">SECTOR: XRP-7</div>
                            </div>
                            <div style="padding: 15px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                                <div>
                                    <h3 style="margin: 0 0 10px 0; color: var(--cyan); letter-spacing: 2px;">XRP-7 MINING</h3>
                                    <p style="font-size: 12px; line-height: 1.4; opacity: 0.7; margin-bottom: 20px;">
                                        Extract high-density BERT and DROP resources from the XRP-7 crystalline crust. High-yield potential confirmed.
                                    </p>
                                </div>
                                <button class="btn" onclick="CombatSystem.startMining()" style="border-color: var(--cyan); color: var(--cyan); width: 100%; padding: 12px;">RUN DRILL RIG</button>
                            </div>
                        </div>

                    </div>

                    <!-- FOOTER STATUS -->
                    <div style="font-size: 10px; text-align: center; opacity: 0.4; letter-spacing: 1px;">
                        UPLINK SECURE -- NO UNAUTHORIZED ACCESS -- DATA TERMINAL V8.2
                    </div>
                </div>
            </div>
        `;
    },

    startCombat() {
        console.log('[CombatSystem] Launching Neural Combat simulator...');
        this.state.view = 'combat';
        this.state.score = 0;
        this.state.wave = 1;
        this.state.gameOver = false;
        this.state.active = true;
        this.state.bullets = [];
        this.state.enemies = [];
        this.state.enemyBullets = [];
        this.state.particles = [];
        this.state.player.x = 130;
        
        this.renderCombatUI();
        this.setupCanvas('combat-canvas');
        this.setupControls();
        this.initWave();
        
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.lastTimestamp = 0;
        this.animationId = requestAnimationFrame(this.loop.bind(this));
    },

    renderCombatUI() {
        const container = document.getElementById('game-room-container');
        container.innerHTML = `
            <div style="width: 100%; max-width: 400px; margin: 0 auto; font-family: Orbitron; padding: 10px;">
                <div class="panel" style="border-color: #ff3b6b; position: relative; overflow: hidden; background: #000; padding: 10px;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 10px;">
                        <div>SCORE: <span id="game-score">0</span></div>
                        <div style="color: #ff3b6b;">WAVE: <span id="game-wave">1</span></div>
                        <div>HI: \${this.state.highScore}</div>
                    </div>
                    <div style="width: 100%; aspect-ratio: 3/4; position: relative; border: 1px solid rgba(255,59,107,0.3);">
                        <canvas id="combat-canvas" width="300" height="400" style="width: 100%; height: 100%; display: block;"></canvas>
                        <div id="game-overlay" style="position: absolute; top:0; left:0; width:100%; height:100%; display:none; background:rgba(0,0,0,0.8); flex-direction:column; align-items:center; justify-content:center;">
                            <h2 style="color:#ff3b6b; margin-bottom:20px;">LINK SEVERED</h2>
                            <button class="btn" onclick="CombatSystem.startCombat()" style="padding:10px 20px;">REBOOT</button>
                            <button class="btn" onclick="CombatSystem.renderSectorMap()" style="margin-top:10px; border-color:var(--cyan); color:var(--cyan);">SECTOR MAP</button>
                        </div>
                    </div>
                    <!-- MOBILE CONTROLS -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 15px;">
                        <button class="btn" id="ctrl-left" style="height: 60px; font-size: 24px;">←</button>
                        <button class="btn" id="ctrl-fire" style="height: 60px; border-color: #ff3b6b; color: #ff3b6b;">FIRE</button>
                        <button class="btn" id="ctrl-right" style="height: 60px; font-size: 24px;">→</button>
                    </div>
                    <button class="btn" onclick="CombatSystem.renderSectorMap()" style="width:100%; margin-top:10px; font-size:10px; opacity:0.6;">ABORT SIMULATION</button>
                </div>
            </div>
        `;
    },

    startMining() {
        console.log('[CombatSystem] Deploying XRP-7 Drill Rig...');
        this.state.view = 'mining';
        this.state.miningState = {
            drillRotation: 0,
            depth: 0,
            bertCollected: 0,
            dropCollected: 0,
            isDrilling: false
        };
        this.renderMiningUI();
        this.setupCanvas('mining-canvas');
        
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.lastTimestamp = 0;
        this.animationId = requestAnimationFrame(this.loop.bind(this));
    },

    renderMiningUI() {
        const container = document.getElementById('game-room-container');
        container.innerHTML = `
            <div style="width: 100%; max-width: 400px; margin: 0 auto; font-family: Orbitron; padding: 10px;">
                <div class="panel" style="border-color: var(--cyan); background: #000; padding: 15px;">
                    <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 15px; color: var(--cyan);">
                        <div>BERT: <span id="mine-bert">0</span></div>
                        <div>DROP: <span id="mine-drop">0</span></div>
                        <div>DEPTH: <span id="mine-depth">0</span>m</div>
                    </div>
                    <div style="width: 100%; aspect-ratio: 1/1; position: relative; border: 1px solid rgba(0,255,200,0.2); background: #0a0a0a;">
                        <canvas id="mining-canvas" width="400" height="400" style="width: 100%; height: 100%;"></canvas>
                    </div>
                    <div style="margin-top: 20px;">
                        <button class="btn" id="drill-btn" 
                            onmousedown="CombatSystem.state.miningState.isDrilling=true" 
                            onmouseup="CombatSystem.state.miningState.isDrilling=false"
                            ontouchstart="CombatSystem.state.miningState.isDrilling=true"
                            ontouchend="CombatSystem.state.miningState.isDrilling=false"
                            style="width: 100%; height: 80px; font-size: 20px; border-color: var(--cyan); color: var(--cyan);">
                            HOLD TO DRILL
                        </button>
                    </div>
                    <button class="btn" onclick="CombatSystem.renderSectorMap()" style="width:100%; margin-top:15px; font-size:10px; opacity:0.6;">RETURN TO SECTOR MAP</button>
                </div>
            </div>
        `;
    },

    setupCanvas(id) {
        this.canvas = document.getElementById(id);
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
        };
        bindBtn('ctrl-left', 'ArrowLeft');
        bindBtn('ctrl-right', 'ArrowRight');
        bindBtn('ctrl-fire', 'Space');
    },

    initWave() {
        this.state.enemies = [];
        const rows = 3, cols = 5, padding = 10, width = 30, height = 30;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.state.enemies.push({
                    x: c * (width + padding) + 50, y: r * (height + padding) + 40,
                    w: width, h: height, type: (r % 2 === 0 ? 'spore' : 'acid'),
                    hp: 1, direction: 1, speed: 1 + (this.state.wave * 0.2)
                });
            }
        }
    },

    loop(timestamp) {
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        let dt = (timestamp - this.lastTimestamp) / 16.67;
        dt = Math.min(dt, 2.0);
        this.lastTimestamp = timestamp;

        if (this.state.view === 'combat') {
            this.updateCombat(dt);
            this.drawCombat();
        } else if (this.state.view === 'mining') {
            this.updateMining(dt);
            this.drawMining();
        }

        if (this.state.view !== 'sector') {
            this.animationId = requestAnimationFrame(this.loop.bind(this));
        }
    },

    updateCombat(dt) {
        if (!this.state.active || this.state.gameOver) return;

        // Player Move
        if (this.state.keys['ArrowLeft'] && this.state.player.x > 0) this.state.player.x -= this.state.player.speed * dt;
        if (this.state.keys['ArrowRight'] && this.state.player.x < 300 - this.state.player.w) this.state.player.x += this.state.player.speed * dt;

        // Fire
        const now = Date.now();
        if (this.state.keys['Space'] && now - this.state.lastFire > 250) {
            this.state.bullets.push({ x: this.state.player.x + this.state.player.w/2 - 2, y: this.state.player.y, w: 4, h: 10, speed: 7 });
            this.state.lastFire = now;
        }

        // Bullets
        this.state.bullets = this.state.bullets.filter(b => { b.y -= b.speed * dt; return b.y > -20; });
        this.state.enemyBullets = this.state.enemyBullets.filter(b => { b.y += b.speed * dt; return b.y < 420; });

        // Enemies
        let edgeHit = false;
        this.state.enemies.forEach(e => {
            e.x += e.direction * e.speed * dt;
            if (e.x <= 0 || e.x >= 300 - e.w) edgeHit = true;
            if (Math.random() < 0.005 * this.state.wave) {
                this.state.enemyBullets.push({ x: e.x + e.w/2, y: e.y + e.h, w: 4, h: 10, speed: 3 });
            }
        });

        if (edgeHit) {
            this.state.enemies.forEach(e => { e.direction *= -1; e.y += 10; if (e.y > 340) this.endCombat(); });
        }

        // Collisions
        this.state.bullets.forEach((b, bi) => {
            this.state.enemies.forEach((e, ei) => {
                if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
                    this.state.bullets.splice(bi, 1);
                    this.state.enemies.splice(ei, 1);
                    this.state.score += 100;
                    document.getElementById('game-score').textContent = this.state.score;
                    if (this.state.enemies.length === 0) {
                        this.state.wave++;
                        document.getElementById('game-wave').textContent = this.state.wave;
                        this.initWave();
                    }
                }
            });
        });

        this.state.enemyBullets.forEach(b => {
            const p = this.state.player;
            if (b.x < p.x + p.w && b.x + b.w > p.x && b.y < p.y + p.h && b.y + b.h > p.y) this.endCombat();
        });
    },

    endCombat() {
        this.state.active = false;
        this.state.gameOver = true;
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            localStorage.setItem('ggb_high_score', this.state.highScore);
        }
        document.getElementById('game-overlay').style.display = 'flex';
    },

    drawCombat() {
        const ctx = this.ctx;
        if (!ctx) return;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 300, 400);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        for(let i=0; i<300; i+=20) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,400); ctx.stroke(); }

        // Player (The Gross Bro)
        if (this.state.playerImage && this.state.playerImage.complete) {
            ctx.drawImage(this.state.playerImage, this.state.player.x, this.state.player.y, this.state.player.w, this.state.player.h);
        } else {
            ctx.fillStyle = 'var(--cyan)';
            ctx.fillRect(this.state.player.x, this.state.player.y, this.state.player.w, this.state.player.h);
        }

        // Enemies
        this.state.enemies.forEach(e => {
            ctx.fillStyle = (e.type === 'spore' ? '#39ff14' : '#ffaa00');
            ctx.fillRect(e.x, e.y, e.w, e.h);
        });

        // Bullets
        ctx.fillStyle = '#fff';
        this.state.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
        ctx.fillStyle = '#ff3b6b';
        this.state.enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    },

    updateMining(dt) {
        const s = this.state.miningState;
        if (s.isDrilling) {
            s.drillRotation += 0.2 * dt;
            s.depth += 0.5 * dt;
            if (Math.random() < 0.05) {
                if (Math.random() > 0.3) s.bertCollected += 1;
                else s.dropCollected += 1;
            }
            document.getElementById('mine-bert').textContent = Math.floor(s.bertCollected);
            document.getElementById('mine-drop').textContent = Math.floor(s.dropCollected);
            document.getElementById('mine-depth').textContent = Math.floor(s.depth);
        }
    },

    drawMining() {
        const ctx = this.ctx;
        const s = this.state.miningState;
        if (!ctx) return;

        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, 400, 400);

        // Rock Layer
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 100, 400, 300);

        // Drill Rig (The Gross Bro as the operator/head)
        ctx.save();
        ctx.translate(200, 80);
        
        // Rotating drill bit
        ctx.save();
        ctx.rotate(s.drillRotation);
        ctx.strokeStyle = 'var(--cyan)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for(let i=0; i<8; i++) {
            ctx.rotate(Math.PI/4);
            ctx.moveTo(0,0);
            ctx.lineTo(0, 40);
        }
        ctx.stroke();
        ctx.restore();

        // Operator Head
        if (this.state.playerImage && this.state.playerImage.complete) {
            ctx.drawImage(this.state.playerImage, -30, -30, 60, 60);
        } else {
            ctx.fillStyle = 'var(--cyan)';
            ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.fill();
        }
        ctx.restore();

        // Dust particles if drilling
        if (s.isDrilling) {
            ctx.fillStyle = '#444';
            for(let i=0; i<10; i++) {
                ctx.fillRect(150 + Math.random()*100, 120 + Math.random()*20, 4, 4);
            }
        }
    }
};

window.CombatSystem = CombatSystem;
CombatSystem.init();
