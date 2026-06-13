(async () => {
  const CombatSystem = {
    state: {
      health: 100,
      enemyHealth: 100,
      active: false,
      logs: []
    },
    init: function() {
      const container = document.getElementById('game-room-container');
      if (!container) return;
      container.innerHTML = \"<div class='panel' style='background:rgba(255,59,107,0.05); border-color:#ff3b6b;'><h3 style='font-family:Orbitron; color:#ff3b6b;'>COMBAT SIMULATOR</h3><div id='combat-status' style='margin-bottom:10px;'>AWAITING OPPONENT...</div><div class='row'><button class='btn' onclick='CombatSystem.start()'>INITIALIZE ENGAGEMENT</button></div><div id='combat-log' class='chat-log' style='margin-top:20px; height:150px;'></div></div>\";
    },
    start: function() {
      this.state.active = true;
      this.log('ENGAGEMENT STARTED. TARGET ACQUIRED.');
      this.updateUI();
    },
    log: function(msg) {
      this.state.logs.push(msg);
      const logEl = document.getElementById('combat-log');
      if (logEl) {
        logEl.innerHTML = this.state.logs.map(l => \"<div style='font-size:11px; color:#ff3b6b;'>[!] \" + l + \"</div>\").join('');
        logEl.scrollTop = logEl.scrollHeight;
      }
    },
    updateUI: function() {
      const status = document.getElementById('combat-status');
      if (status) status.textContent = 'HEALTH: ' + this.state.health + ' | ENEMY: ' + this.state.enemyHealth;
    }
  };
  window.CombatSystem = CombatSystem;
})();