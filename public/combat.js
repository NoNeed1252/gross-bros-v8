const CombatSystem = {
    state: {
        active: false,
        player: { hp: 100, maxHp: 100, energy: 50 },
        enemy: { name: "CCE CLEANUP DRONE", hp: 120, maxHp: 120 },
        log: []
    },

    init() {
        console.log("Combat system initializing...");
        this.render();
    },

    render() {
        const container = document.getElementById('combat-container');
        if (!container) return;

        container.innerHTML = `
            <div class="panel" style="border-color: #ff3b6b; box-shadow: 0 0 20px rgba(255,59,107,0.15);">
                <div class="muted" style="letter-spacing:.35em;text-transform:uppercase;font-size:11px;color:#ff3b6b;">Engagement Zone</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                    <div class="panel" style="background: rgba(0,255,200,0.05);">
                        <div style="font-family: Orbitron; font-size: 14px;">OPERATIVE</div>
                        <div style="height: 10px; background: #222; margin: 10px 0; border-radius: 5px; overflow: hidden;">
                            <div style="width: ${this.state.player.hp}%; height: 100%; background: var(--cyan); transition: width 0.3s ease;"></div>
                        </div>
                        <div style="font-size: 12px;">HP: ${this.state.player.hp}/${this.state.player.maxHp}</div>
                    </div>
                    <div class="panel" style="background: rgba(255,59,107,0.05); border-color: rgba(255,59,107,0.2);">
                        <div style="font-family: Orbitron; font-size: 14px; color: #ff3b6b;">${this.state.enemy.name}</div>
                        <div style="height: 10px; background: #222; margin: 10px 0; border-radius: 5px; overflow: hidden;">
                            <div style="width: ${(this.state.enemy.hp / this.state.enemy.maxHp) * 100}%; height: 100%; background: #ff3b6b; transition: width 0.3s ease;"></div>
                        </div>
                        <div style="font-size: 12px; color: #ff3b6b;">HP: ${this.state.enemy.hp}/${this.state.enemy.maxHp}</div>
                    </div>
                </div>
                
                <div id="combat-log" style="height: 150px; overflow-y: auto; background: rgba(0,0,0,0.5); border: 1px solid rgba(0,255,200,0.1); margin-top: 20px; padding: 10px; font-size: 12px; display: flex; flex-direction: column; gap: 5px;">
                    ${this.state.log.map(entry => `<div>${entry}</div>`).join('')}
                </div>

                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="btn" onclick="CombatSystem.attack()" style="border-color: #ff3b6b; color: #ff3b6b;">STRIKE</button>
                    <button class="btn" onclick="CombatSystem.defend()">BRACE</button>
                    <button class="btn" onclick="CombatSystem.reset()">REBOOT</button>
                </div>
            </div>
        `;
        
        const log = document.getElementById('combat-log');
        if (log) log.scrollTop = log.scrollHeight;
    },

    attack() {
        const dmg = Math.floor(Math.random() * 20) + 10;
        this.state.enemy.hp = Math.max(0, this.state.enemy.hp - dmg);
        this.state.log.push(\`[>] OPERATIVE STRIKES FOR \${dmg} DAMAGE.\`);
        
        if (this.state.enemy.hp <= 0) {
            this.state.log.push(\`[!] TARGET NEUTRALIZED.\`);
        } else {
            this.enemyTurn();
        }
        this.render();
    },

    enemyTurn() {
        const dmg = Math.floor(Math.random() * 15) + 5;
        this.state.player.hp = Math.max(0, this.state.player.hp - dmg);
        this.state.log.push(\`[<] \${this.state.enemy.name} RECHANNELS \${dmg} DAMAGE.\`);
        if (this.state.player.hp <= 0) {
            this.state.log.push(\`[CRITICAL] NEURAL LINK SEVERED. OPERATIVE OFFLINE.\`);
        }
    },

    defend() {
        const heal = Math.floor(Math.random() * 10) + 5;
        this.state.player.hp = Math.min(this.state.player.maxHp, this.state.player.hp + heal);
        this.state.log.push(\`[+] REPAIR PROTOCOL INITIATED. +\${heal} HP.\`);
        this.enemyTurn();
        this.render();
    },

    reset() {
        this.state.player.hp = 100;
        this.state.enemy.hp = 120;
        this.state.log = ["INITIATING COMBAT SUBROUTINE..."];
        this.render();
    }
};

window.CombatSystem = CombatSystem;
