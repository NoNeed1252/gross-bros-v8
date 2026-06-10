/**
 * NEON CASCADE: MATCH-3 ENGINE (OVERLAY EDITION)
 * Stable Release for Alpha Operative.
 */

const CombatSystem = {
    config: {
        gridSize: 8,
        types: [
            { id: 42,  name: 'Specimen #042', color: '#00ffc8', icon: '🕶️' },
            { id: 118, name: 'Specimen #118', color: '#39ff14', icon: '🧐' },
            { id: 256, name: 'Specimen #256', color: '#ff3b6b', icon: '😎' },
            { id: 522, name: 'Specimen #522', color: '#ccff00', icon: '🥽' },
            { id: 889, name: 'Specimen #889', color: '#7c3aed', icon: '👤' }
        ]
    },

    state: {
        grid: [],
        score: 0,
        highScore: localStorage.getItem('neon_cascade_hi') || 0,
        isProcessing: false,
        selectedTile: null,
        audioCtx: null,
        active: false
    },

    init() {
        const hi = localStorage.getItem('neon_cascade_hi') || 0;
        const hiEl = document.getElementById('launcher-hi-score');
        if (hiEl) hiEl.textContent = hi;
        console.log("NEON_CASCADE: Launcher standby. Ready, Alpha.");
    },

    launch() {
        this.state.active = true;
        const overlay = document.getElementById('game-overlay');
        const target = document.getElementById('game-canvas-target');
        
        if (!overlay || !target) {
            console.error("CRITICAL: Overlay targets missing in DOM.");
            return;
        }

        overlay.style.display = 'flex';
        this.renderGameUI(target);
        this.setupAudio();
        this.resetGame();
        
        console.log("NEON_CASCADE: Neural link established. Signal locked.");
    },

    terminate() {
        this.state.active = false;
        const overlay = document.getElementById('game-overlay');
        const target = document.getElementById('game-canvas-target');
        
        if (overlay) overlay.style.display = 'none';
        if (target) target.innerHTML = '';
        
        if (this.state.audioCtx) {
            this.state.audioCtx.suspend();
        }

        const hiEl = document.getElementById('launcher-hi-score');
        if (hiEl) hiEl.textContent = this.state.highScore;

        console.log("NEON_CASCADE: Neural link severed. System idling.");
    },

    setupAudio() {
        if (!this.state.audioCtx) {
            this.state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } else if (this.state.audioCtx.state === 'suspended') {
            this.state.audioCtx.resume();
        }
    },

    playSynth(freq, type, duration, vol = 0.1) {
        if (!this.state.audioCtx || this.state.audioCtx.state === 'suspended') return;
        try {
            const osc = this.state.audioCtx.createOscillator();
            const gain = this.state.audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.state.audioCtx.currentTime);
            gain.gain.setValueAtTime(vol, this.state.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.state.audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.state.audioCtx.destination);
            osc.start();
            osc.stop(this.state.audioCtx.currentTime + duration);
        } catch (e) { console.warn("Audio glitch ignored."); }
    },

    renderGameUI(container) {
        const hi = this.state.highScore;
        container.innerHTML = `
            <style>
                #nc-game-wrap {
                    width: 100%; max-width: 320px;
                    display: flex; flex-direction: column; gap: 10px;
                }
                .nc-stats {
                    display: flex; justify-content: space-between;
                    font-family: Orbitron; font-size: 14px; padding: 5px;
                }
                #nc-board {
                    display: grid; grid-template-columns: repeat(8, 1fr);
                    gap: 2px; background: rgba(0,255,200,0.1);
                    border: 2px solid var(--cyan); border-radius: 8px;
                    padding: 4px; aspect-ratio: 1/1;
                }
                .nc-tile {
                    aspect-ratio: 1/1; background: rgba(0,0,0,0.6);
                    border-radius: 4px; display: flex; align-items: center;
                    justify-content: center; cursor: pointer; font-size: 20px;
                    transition: transform 0.1s, box-shadow 0.2s;
                }
                .nc-tile.selected {
                    box-shadow: inset 0 0 10px var(--cyan);
                    background: rgba(0,255,200,0.2);
                }
                .nc-tile.match { animation: nc-pop 0.3s forwards; }
                @keyframes nc-pop {
                    50% { transform: scale(1.3); filter: brightness(2); }
                    100% { transform: scale(0); opacity: 0; }
                }
            </style>
            <div id="nc-game-wrap">
                <div class="nc-stats">
                    <div>SCORE: <span id="nc-score">0</span></div>
                    <div>HI: <span id="nc-hi">${hi}</span></div>
                </div>
                <div id="nc-board"></div>
                <div style="font-size:10px; opacity:0.5; text-align:center;">MATCH 3 SPECIMENS TO STABILIZE CORE</div>
            </div>
        `;
        this.boardEl = document.getElementById('nc-board');
    },

    resetGame() {
        this.state.score = 0;
        this.state.isProcessing = false;
        this.state.selectedTile = null;
        this.updateScore(0);
        this.createGrid();
    },

    createGrid() {
        let valid = false;
        while (!valid) {
            this.state.grid = [];
            for (let r = 0; r < 8; r++) {
                this.state.grid[r] = [];
                for (let c = 0; c < 8; c++) {
                    this.state.grid[r][c] = Math.floor(Math.random() * this.config.types.length);
                }
            }
            if (this.getMatches().length === 0) valid = true;
        }
        this.renderGrid();
    },

    renderGrid() {
        if (!this.boardEl) return;
        this.boardEl.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const typeIdx = this.state.grid[r][c];
                if (typeIdx === -1) continue;
                const type = this.config.types[typeIdx];
                const tile = document.createElement('div');
                tile.className = 'nc-tile';
                tile.dataset.r = r;
                tile.dataset.c = c;
                tile.innerHTML = type.icon;
                tile.style.color = type.color;
                tile.onclick = () => this.handleTileClick(r, c, tile);
                this.boardEl.appendChild(tile);
            }
        }
    },

    handleTileClick(r, c, el) {
        if (this.state.isProcessing) return;
        this.playSynth(440, 'square', 0.05, 0.05);

        if (!this.state.selectedTile) {
            this.state.selectedTile = { r, c, el };
            el.classList.add('selected');
        } else {
            const first = this.state.selectedTile;
            const dist = Math.abs(first.r - r) + Math.abs(first.c - c);

            if (dist === 1) {
                this.swap(first.r, first.c, r, c);
            } else {
                first.el.classList.remove('selected');
                this.state.selectedTile = { r, c, el };
                el.classList.add('selected');
            }
        }
    },

    async swap(r1, c1, r2, c2) {
        this.state.isProcessing = true;
        if (this.state.selectedTile) this.state.selectedTile.el.classList.remove('selected');
        this.state.selectedTile = null;

        const temp = this.state.grid[r1][c1];
        this.state.grid[r1][c1] = this.state.grid[r2][c2];
        this.state.grid[r2][c2] = temp;

        this.renderGrid();

        const matches = this.getMatches();
        if (matches.length > 0) {
            await this.processChain();
        } else {
            this.playSynth(220, 'sawtooth', 0.1);
            await new Promise(res => setTimeout(res, 200));
            this.state.grid[r2][c2] = this.state.grid[r1][c1];
            this.state.grid[r1][c1] = temp;
            this.renderGrid();
            this.state.isProcessing = false;
        }
    },

    getMatches() {
        const matches = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 6; c++) {
                const t = this.state.grid[r][c];
                if (t !== -1 && t === this.state.grid[r][c+1] && t === this.state.grid[r][c+2]) {
                    matches.push({r, c}, {r, c:c+1}, {r, c:c+2});
                }
            }
        }
        for (let c = 0; c < 8; c++) {
            for (let r = 0; r < 6; r++) {
                const t = this.state.grid[r][c];
                if (t !== -1 && t === this.state.grid[r+1][c] && t === this.state.grid[r+2][c]) {
                    matches.push({r, c}, {r:r+1, c}, {r:r+2, c});
                }
            }
        }
        return Array.from(new Set(matches.map(m => \`\${m.r},\${m.c}\`)))
            .map(s => { const [r,c] = s.split(',').map(Number); return {r, c}; });
    },

    async processChain() {
        const matches = this.getMatches();
        if (matches.length === 0) {
            this.state.isProcessing = false;
            return;
        }

        matches.forEach(m => {
            const el = this.boardEl.querySelector(\`[data-r="\${m.r}"][data-c="\${m.c}"]\`);
            if (el) el.classList.add('match');
        });

        this.updateScore(matches.length * 10);
        this.playSynth(880, 'sine', 0.2);
        await new Promise(res => setTimeout(res, 350));

        matches.forEach(m => { this.state.grid[m.r][m.c] = -1; });

        for (let c = 0; c < 8; c++) {
            let empty = 7;
            for (let r = 7; r >= 0; r--) {
                if (this.state.grid[r][c] !== -1) {
                    this.state.grid[empty][c] = this.state.grid[r][c];
                    if (empty !== r) this.state.grid[r][c] = -1;
                    empty--;
                }
            }
            for (let r = empty; r >= 0; r--) {
                this.state.grid[r][c] = Math.floor(Math.random() * this.config.types.length);
            }
        }

        this.renderGrid();
        await new Promise(res => setTimeout(res, 150));
        await this.processChain();
    },

    updateScore(pts) {
        this.state.score += pts;
        const sEl = document.getElementById('nc-score');
        if (sEl) sEl.textContent = this.state.score;
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            localStorage.setItem('neon_cascade_hi', this.state.highScore);
            const hiEl = document.getElementById('nc-hi');
            if (hiEl) hiEl.textContent = this.state.highScore;
        }
    }
};

window.CombatSystem = CombatSystem;