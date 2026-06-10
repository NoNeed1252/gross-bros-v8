/**
 * NEON CASCADE: MATCH-3 ENGINE
 * Replaces old shooter with modern Match-3 logic.
 * Features: 8x8 Grid, Drag-to-Swap, Cascading, Synth Audio, Alpha Narrative.
 */

const CombatSystem = {
    config: {
        gridSize: 8,
        tileSize: 36,
        gap: 2,
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

    init() {
        this.renderLayout();
        this.setupAudio();
        this.resetGame();
        console.log("NEON CASCADE: Neural Link Established. Welcome, Alpha.");
    },

    setupAudio() {
        if (!this.state.audioCtx) {
            this.state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    playSynth(freq, type, duration, vol = 0.1) {
        if (!this.state.audioCtx) return;
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
    },

    renderLayout() {
        const container = document.getElementById('game-room-container');
        if (!container) return;

        container.innerHTML = `
            <style>
                #neon-cascade-ui {
                    max-width: 320px;
                    margin: 0 auto;
                    font-family: 'Share Tech Mono', monospace;
                    color: var(--cyan);
                    user-select: none;
                }
                .stats-bar {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    font-family: 'Orbitron', sans-serif;
                    font-size: 12px;
                    text-transform: uppercase;
                }
                #game-board {
                    display: grid;
                    grid-template-columns: repeat(8, 1fr);
                    grid-template-rows: repeat(8, 1fr);
                    gap: 2px;
                    background: rgba(0, 255, 200, 0.1);
                    border: 2px solid var(--cyan);
                    border-radius: 8px;
                    padding: 4px;
                    aspect-ratio: 1/1;
                    position: relative;
                    overflow: hidden;
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
                    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.2s;
                    position: relative;
                    font-size: 20px;
                }
                .tile:active { transform: scale(0.9); }
                .tile.selected {
                    background: rgba(0, 255, 200, 0.2);
                    box-shadow: inset 0 0 10px var(--cyan);
                    z-index: 2;
                }
                .tile.match-anim {
                    animation: tile-pop 0.4s forwards;
                }
                @keyframes tile-pop {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.4); filter: brightness(2); }
                    100% { transform: scale(0); opacity: 0; }
                }
                .cascade-anim {
                    animation: cascade-down 0.3s ease-in;
                }
                @keyframes cascade-down {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(0); }
                }
                .narrative-box {
                    margin-top: 15px;
                    font-size: 11px;
                    background: rgba(0,0,0,0.4);
                    padding: 10px;
                    border: 1px dashed var(--line);
                    line-height: 1.4;
                }
            </style>
            <div id="neon-cascade-ui">
                <div class="stats-bar">
                    <div>ALPHA_CORE: <span id="nc-score">0</span></div>
                    <div>HI_SCORE: <span id="nc-hi">\${this.state.highScore}</span></div>
                </div>
                <div id="game-board"></div>
                <div class="narrative-box">
                    [!] <span style="color:#fff">SYSTEM:</span> CASCADE PROTOCOL ENGAGED.<br>
                    [!] <span style="color:#fff">ALPHA:</span> MATCH GGB SPECIMENS TO PURGE THE BUFFER.
                </div>
                <button class="btn" onclick="CombatSystem.resetGame()" style="width:100%; margin-top:10px;">REBOOT CASCADE</button>
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
        while (!validBoard) {
            this.state.grid = [];
            for (let r = 0; r < 8; r++) {
                this.state.grid[r] = [];
                for (let c = 0; c < 8; c++) {
                    this.state.grid[r][c] = Math.floor(Math.random() * this.config.types.length);
                }
            }
            // Check for initial matches, rebuild if any exist (to start clean)
            if (!this.findMatches().length) validBoard = true;
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
        this.playSynth(440, 'square', 0.05, 0.05);

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
                this.state.selectedTile = { r, c, el };
                el.classList.add('selected');
            }
        }
    },

    async swapTiles(r1, c1, r2, c2) {
        this.state.isProcessing = true;
        if (this.state.selectedTile) this.state.selectedTile.el.classList.remove('selected');
        this.state.selectedTile = null;

        // Perform swap logic
        const temp = this.state.grid[r1][c1];
        this.state.grid[r1][c1] = this.state.grid[r2][c2];
        this.state.grid[r2][c2] = temp;

        this.renderBoard();

        const matches = this.findMatches();
        if (matches.length > 0) {
            this.playSynth(523.25, 'sine', 0.1, 0.1); // C5
            await this.processMatches();
        } else {
            // Revert swap if no match
            this.playSynth(220, 'sawtooth', 0.1, 0.1);
            await new Promise(r => setTimeout(r, 250));
            const temp2 = this.state.grid[r1][c1];
            this.state.grid[r1][c1] = this.state.grid[r2][c2];
            this.state.grid[r2][c2] = temp2;
            this.renderBoard();
            this.state.isProcessing = false;
        }
    },

    findMatches() {
        const matches = [];
        // Horizontal
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 6; c++) {
                const t = this.state.grid[r][c];
                if (t === this.state.grid[r][c+1] && t === this.state.grid[r][c+2]) {
                    matches.push({r, c}, {r, c:c+1}, {r, c:c+2});
                }
            }
        }
        // Vertical
        for (let c = 0; c < 8; c++) {
            for (let r = 0; r < 6; r++) {
                const t = this.state.grid[r][c];
                if (t === this.state.grid[r+1][c] && t === this.state.grid[r+2][c]) {
                    matches.push({r, c}, {r:r+1, c}, {r:r+2, c});
                }
            }
        }
        // Deduplicate
        return Array.from(new Set(matches.map(m => \`\${m.r},\${m.c}\`)))
                    .map(s => { const [r,c] = s.split(',').map(Number); return {r, c}; });
    },

    async processMatches() {
        const matches = this.findMatches();
        if (matches.length === 0) {
            this.state.isProcessing = false;
            return;
        }

        // Mark tiles for animation
        matches.forEach(m => {
            const el = this.boardEl.querySelector(\`[data-r="\${m.r}"][data-c="\${m.c}"]\`);
            if (el) el.classList.add('match-anim');
        });

        this.updateScore(matches.length * 10);
        this.playSynth(880, 'sine', 0.2, 0.1);

        await new Promise(r => setTimeout(r, 400));

        // Remove matched tiles
        matches.forEach(m => { this.state.grid[m.r][m.c] = -1; });

        // Collapse columns
        for (let c = 0; c < 8; c++) {
            let emptySpot = 7;
            for (let r = 7; r >= 0; r--) {
                if (this.state.grid[r][c] !== -1) {
                    this.state.grid[emptySpot][c] = this.state.grid[r][c];
                    if (emptySpot !== r) this.state.grid[r][c] = -1;
                    emptySpot--;
                }
            }
            // Fill new ones
            for (let r = emptySpot; r >= 0; r--) {
                this.state.grid[r][c] = Math.floor(Math.random() * this.config.types.length);
            }
        }

        this.renderBoard();
        // Check for chain reactions
        await new Promise(r => setTimeout(r, 100));
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

window.CombatSystem = CombatSystem;