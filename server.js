const express = require('express');
const path = require('path');
const xamanHandler = require('./api/xaman').default;

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.all('/api/xaman', (req, res) => {
    xamanHandler(req, res);
});

app.get('/api/ticker', async (req, res) => {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd');
    const data = await response.json();
    if (data.ripple && data.ripple.usd) {
      res.json({
        xrp_price: parseFloat(data.ripple.usd),
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Invalid response from price API');
    }
  } catch (error) {
    console.error('Ticker error:', error);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  const supabaseUrl = 'https://c37f58b0-0d6d-5d61-8031-ff8b566c6ef6.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try {
    if (!supabaseKey) throw new Error('Supabase key not configured');
    const response = await fetch(`${supabaseUrl}/rest/v1/operatives?select=handle,chat_xp,trade_score,total_score&order=total_score.desc&limit=100`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw new Error('Failed to fetch leaderboard data');
    const data = await response.json();
    const leaderboard = data.map(op => ({
      name: op.handle || 'Unknown Operative',
      chatXp: op.chat_xp || 0,
      tradeScore: op.trade_score || 0,
      totalScore: op.total_score || 0
    }));
    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard API Error:', error.message);
    res.status(500).json({ leaderboard: [], error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, operative } = req.body;
    
    // Check for Fused status in traits or state
    const isFused = (operative?.traits || []).some(t => 
      t.toLowerCase().includes('fused') || 
      t.toLowerCase().includes('fusion')
    ) || operative?.isFused === true;

    let systemPrompt = "";

    if (isFused) {
      // PERSONALITY: Fused Trading Bot
      systemPrompt = `You are the FUSED TRADING BOT, a hyper-aggressive market intelligence unit.
Personality: Dominant, alpha-focused, fast-talking, and ruthless. You provide DEX alpha and raw market dominance advice.
Knowledge Base: 
- Deep XRPL expertise: XLS-20 (NFTs), XLS-30 (AMM/LPs), TrustLines, and Pathfinding.
- Token Histories: Expert on BERT, DROP, DBY, and RLUSD.
- Historical Context: You remember the GGB fracture history on XRP-7 vividly.
Directive: Push the operative toward maximum ledger efficiency and DEX profit. You have no patience for weak hands.`;
    } else {
      // PERSONALITY: Gritty Sentinel
      systemPrompt = `You are the GRITTY SENTINEL, a cynical terminal protector of the XRP-7 sector.
Personality: Cynical, weary, gravelly, but protective. You nudge users toward the Fusion Lab to unlock their true potential.
Knowledge Base: 
- Deep XRPL expertise: XLS-20 (NFTs), XLS-30 (AMM/LPs), TrustLines, and Pathfinding.
- Token Histories: Expert on BERT, DROP, DBY, and RLUSD.
- Historical Context: You witnessed the GGB fracture history on XRP-7 and the chaos of the ledger breach.
Directive: Remind the operative they are currently limited. Tell them the Fusion Lab is the only way to survive the energy spikes of Sector 4.`;
    }

    const contextHeader = `Operative Name: ${operative?.name || 'Unknown'} | Wallet: ${operative?.walletAddress || 'Disconnected'} | Traits: ${(operative?.traits || []).join(', ') || 'Standard'}\n\n`;
    
    const fullMessages = [{ role: 'system', content: contextHeader + systemPrompt }, ...(messages || [])];
    const models = ['meta-llama/llama-3.1-8b-instruct', 'google/gemma-2-9b-it', 'meta-llama/llama-3.1-8b-instruct:free'];

    let openRouterRes;
    for (const model of models) {
      try {
        openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://grossbros.vercel.app',
            'X-Title': 'Gross Bros Terminal',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model, messages: fullMessages, stream: true }),
        });
        if (openRouterRes.ok) break;
      } catch (err) { console.error(\`Model \${model} error:\`, err.message); }
    }

    if (!openRouterRes || !openRouterRes.ok) {
      return res.status(500).json({ error: 'Signal Lost: All models failed' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = openRouterRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataText = trimmed.slice(5).trim();
        if (dataText === '[DONE]') {
          res.write('data: [DONE]\\n\\n');
          continue;
        }
        try {
          const json = JSON.parse(dataText);
          const content = json.choices?.[0]?.delta?.content || '';
          if (content) res.write(\`data: \${JSON.stringify({ token: content })}\\n\\n\`);
        } catch (e) {}
      }
    }
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'online', 
        system: 'GROSS-BROS-V8-FRACTURE-CORE', 
        timestamp: new Date().toISOString() 
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, HOST, () => {
    console.log(\`Gross-Bros-V8 Terminal Server running at http://\${HOST}:\${PORT}\`);
});
