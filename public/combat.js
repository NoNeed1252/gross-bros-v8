/**
 * NEON CASCADE: MATCH-3 ENGINE (V2 STABLE)
 * Optimized for robust DOM injection and reliable initialization.
 * Features: 8x8 Grid, Drag-to-Swap, Cascading, Synth Audio, Alpha Narrative.
 */

const CombatSystem = {
    config: {
        gridSize: 8,
        types: [
            { id: 42,  name: 'Specimen #042', color: '#00ffc8', icon: '🕶️', label: 'VOID' },
            { id: 118, name: 'Specimen #118', color: '#39ff14', icon: '🧐', label: 'MONO' },
            { id: 256, name: 'Specimen #256', color: '#ff3b6b', icon: '😎', label: 'AVIATOR' },
            { id: 522, name: 'Specimen #522', color: '#ccff00', icon: '🥽', label: 'VISOR' },
            { id: 889, name: 'Specimen #889', color: '#7c3aed', icon: '👤', label: 'SHADOW' }
        ]
    },

    state: {
        grid: [],
        score: 0,
        highScore: localStorage.getItem('neon_cascade_hi') || 0,
        isProcessing: false,
        selectedTile: null,
        audioCtx: null
    },

    /**
     * PRIMARY ENTRY POINT
     * Called by index.html when switching to Tab 2.
     */
    init() {
        console.log("[SYSTEM] Initializing NEON CASCADE for Alpha...");
        
        // Ensure the container exists before proceeding
        const container = document.getElementById('game-room-container');
        if (!container) {
            console.error("[CRITICAL] Game container #game-room-container not found in DOM.");
            return;
        }

        this.renderLayout(container);
        this.setupAudio();
        this.resetGame();
        
        console.log("NEON CASCADE: Neural Link Established. Welcome, Alpha.");
    },

    setupAudio() {
        try {
            if (!this.state.audioCtx) {
                this.state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
        } catch (e) {
            console.warn("[AUDIO] Context initialization failed. Audio disabled.", e);
        }
    },

    playSynth(freq, type, duration, vol = 0.05) {
        if (!this.state.audioCtx || this.state.audioCtx.state === 'suspended') {
            // Browser policy requires user interaction to resume audio
            this.state.audioCtx?.resume();
        }
        if (!this.state.audioCtx) return;

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
        } catch (e) {}
    },

    renderLayout(container) {
        // Inject styles and HTML structure
        container.innerHTML = `
            <style>
                #neon-cascade-ui {
                    max-width: 320px;
                    margin: 0 auto;
                    font-family: 'Share Tech Mono', monospace;
                    color: #00ffc8;
                    user-select: none;
                }
                .stats-bar {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    font-family: 'Orbitron', sans-serif;
                    font-size: 11px;
                    text-transform: uppercase;
                    background: rgba(0, 255, 200, 0.05);
                    padding: 8px;
                    border: 1px solid rgba(0, 255, 200, 0.2);
                    border-radius: 4px;
                }
                #game-board {
                    display: grid;
                    grid-template-columns: repeat(8, 1fr);
                    grid-template-rows: repeat(8, 1fr);
                    gap: 2px;
                    background: rgba(0, 255, 200, 0.1);
                    border: 2px solid #00ffc8;
                    border-radius: 8px;
                    padding: 4px;
                    aspect-ratio: 1/1;
                    position: relative;
                    overflow: hidden;
                    touch-action: none;
                }
                .tile {
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.6);
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    position: relative;
                    font-size: 20px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .tile:hover { background: rgba(0, 255, 200, 0.05); }
                .tile.selected {
                    background: rgba(0, 255, 200, 0.25);
                    box-shadow: inset 0 0 10px #00ffc8;
                    z-index: 2;
                    transform: scale(1.1);
                    border-color: #00ffc8;
                }
                .tile.match-anim {
                    animation: tile-pop 0.35s forwards;
                }
                @keyframes tile-pop {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); filter: brightness(1.5); }
                    100% { transform: scale(0); opacity: 0; }
                }
                .narrative-box {
                    margin-top: 15px;
                    font-size: 10px;
                    background: rgba(0,0,0,0.5);
                    padding: 10px;
                    border: 1px dashed rgba(0, 255, 200, 0.3);
                    line-height: 1.5;
                    color: rgba(0, 255, 200, 0.8);
                }
                .reboot-btn {
                    width: 100%;
                    margin-top: 12px;
                    padding: 10px;
                    background: transparent;
                    border: 1px solid #00ffc8;
                    color: #00ffc8;
                    font-family: 'Orbitron', sans-serif;
                    font-size: 12px;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .reboot-btn:hover {
                    background: rgba(0, 255, 200, 0.1);
                    box-shadow: 0 0 10px rgba(0, 255, 200, 0.3);
                }
            </style>
            <div id="neon-cascade-ui">
                <div class="stats-bar">
                    <div>ALPHA_CORE: <span id="nc-score">0</span></div>
                    <div>HI_SCORE: <span id="nc-hi">\${this.state.highScore}</span></div>
                </div>
                <div id="game-board"></div>
                <div class="narrative-box">
                    [!] <span style="color:#fff">SYSTEM:</span> CASCADE PROTOCOL V2.0 ACTIVE.<br>
                    [!] <span style="color:#fff">ALPHA:</span> SEQUENCING GROSS BROS SPECIMENS...
                </div>
                <button class="reboot-btn" onclick="CombatSystem.resetGame()">REBOOT CASCADE</button>
            </div>
        `;
        this.boardEl = document.getElementById('game-board');
    },

    resetGame() {
        this.state.score = 0;
        this.state.isProcessing = false;
        this.state.selectedTile = null;
        this.updateScore(0);
        this.createBoard();
    },

    createBoard() {
        let validBoard = false;
        let attempts = 0;
        
        while (!validBoard && attempts < 10) {
            this.state.grid = [];
            for (let r = 0; r < 8; r++) {
                this.state.grid[r] = [];
                for (let c = 0; c < 8; c++) {
                    this.state.grid[r][c] = Math.floor(Math.random() * this.config.types.length);
                }
            }
            // Check for initial matches, rebuild if any exist
            if (!this.findMatches().length) validBoard = true;
            attempts++;
        }
        this.renderBoard();
    },

    renderBoard() {
        if (!this.boardEl) return;
        this.boardEl.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const typeIdx = this.state.grid[r][c];
                const type = this.config.types[typeIdx];
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.r = r;
                tile.dataset.c = c;
                tile.style.color = type.color;
                tile.innerHTML = type.icon;
                tile.onclick = (e) => this.handleTileClick(r, c, tile);
                this.boardEl.appendChild(tile);
            }
        }
    },

    handleTileClick(r, c, el) {
        if (this.state.isProcessing) return;
        this.playSynth(440, 'square', 0.05, 0.03);

        if (!this.state.selectedTile) {
            this.state.selectedTile = { r, c, el };
            el.classList.add('selected');
        } else {
            const first = this.state.selectedTile;
            const dist = Math.abs(first.r - r) + Math.abs(first.c - c);

            if (dist === 1) {
                this.swapTiles(first.r, first.c, r, c);
            } else {
                first.el.classList.remove('selected');
                if (first.r === r && first.c === c) {
                    this.state.selectedTile = null;
                } else {
                    this.state.selectedTile = { r, c, el };
                    el.classList.add('selected');
                }
            }
        }
    },

    async swapTiles(r1, c1, r2, c2) {
        this.state.isProcessing = true;
        if (this.state.selectedTile) this.state.selectedTile.el.classList.remove('selected');
        this.state.selectedTile = null;

        const temp = this.state.grid[r1][c1];
        this.state.grid[r1][c1] = this.state.grid[r2][c2];
        this.state.grid[r2][c2] = temp;

        this.renderBoard();

        const matches = this.findMatches();
        if (matches.length > 0) {
            this.playSynth(523, 'sine', 0.1);
            await this.processMatches();
        } else {
            this.playSynth(220, 'sawtooth', 0.1);
            await new Promise(res => setTimeout(res, 250));
            // Revert
            this.state.grid[r2][c2] = this.state.grid[r1][c1];
            this.state.grid[r1][c1] = temp;
            this.renderBoard();
            this.state.isProcessing = false;
        }
    },

    findMatches() {
        const matches = [];
        const grid = this.state.grid;
        // Horizontal
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 6; c++) {
                const t = grid[r][c];
                if (t !== -1 && t === grid[r][c+1] && t === grid[r][c+2]) {
                    matches.push({r, c}, {r, c:c+1}, {r, c:c+2});
                }
            }
        }
        // Vertical
        for (let c = 0; c < 8; c++) {
            for (let r = 0; r < 6; r++) {
                const t = grid[r][c];
                if (t !== -1 && t === grid[r+1][c] && t === grid[r+2][c]) {
                    matches.push({r, c}, {r:r+1, c}, {r:r+2, c});
                }
            }
        }
        return Array.from(new Set(matches.map(m => \`\${m.r},\${m.c}\`)))
                    .map(s => { const [r,c] = s.split(',').map(Number); return {r, c}; });
    },

    async processMatches() {
        const matches = this.findMatches();
        if (matches.length === 0) {
            this.state.isProcessing = false;
            return;
        }

        matches.forEach(m => {
            const el = this.boardEl.querySelector(\`[data-r="\${m.r}"][data-c="\${m.c}"]\`);
            if (el) el.classList.add('match-anim');
        });

        this.updateScore(matches.length * 10);
        this.playSynth(880, 'sine', 0.15);

        await new Promise(res => setTimeout(res, 350));

        matches.forEach(m => { this.state.grid[m.r][m.c] = -1; });

        // Collapse
        for (let c = 0; c < 8; c++) {
            let emptySpot = 7;
            for (let r = 7; r >= 0; r--) {
                if (this.state.grid[r][c] !== -1) {
                    this.state.grid[emptySpot][c] = this.state.grid[r][c];
                    if (emptySpot !== r) this.state.grid[r][c] = -1;
                    emptySpot--;
                }
            }
            for (let r = emptySpot; r >= 0; r--) {
                this.state.grid[r][c] = Math.floor(Math.random() * this.config.types.length);
            }
        }

        this.renderBoard();
        await new Promise(res => setTimeout(res, 150));
        await this.processMatches();
    },

    updateScore(points) {
        this.state.score += points;
        const scoreEl = document.getElementById('nc-score');
        if (scoreEl) scoreEl.textContent = this.state.score;

        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            localStorage.setItem('neon_cascade_hi', this.state.highScore);
            const hiEl = document.getElementById('nc-hi');
            if (hiEl) hiEl.textContent = this.state.highScore;
        }
    }
};

// Export to window
window.CombatSystem = CombatSystem;

// Self-init check: If the container is already there, init immediately.
// This handles cases where combat.js loads AFTER index.html has already switched to the tab.
if (document.getElementById('game-room-container')) {
    CombatSystem.init();
}
