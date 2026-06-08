const express = require('express');
const path = require('path');
// Import as a normal module, but we will wrap it since it looks like an export default handler
const xamanHandler = require('./api/xaman');

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
// Xaman route wrapper
app.all('/api/xaman', (req, res) => {
    xamanHandler(req, res);
});

// New Routes matching Vercel logic
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

// Transmissions API for VPS
app.get('/api/transmissions', async (req, res) => {
  const SUPABASE_URL = 'https://bwvnhlmvyjuowyyltraw.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3dm5obG12eWp1b3d5eWx0cmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzMwOTksImV4cCI6MjA5NTMwOTA5OX0.A51xIwF9TiTWw5BhWit1Pdf4dk-Pw1yK4wr8rrRGuOQ';
  
  const filterDate = req.query.date;

  try {
    const nowStr = new Date().toISOString();
    let queryUrl = `${SUPABASE_URL}/rest/v1/transmissions?select=id,transmission_text,date_added&date_added=lte.${nowStr}&order=date_added.desc`;
    
    if (filterDate) {
      const startOfDay = `${filterDate}T00:00:00`;
      const endOfDay = `${filterDate}T23:59:59`;
      const limitDate = endOfDay < nowStr ? endOfDay : nowStr;
      queryUrl = `${SUPABASE_URL}/rest/v1/transmissions?select=id,transmission_text,date_added&date_added=gte.${startOfDay}&date_added=lte.${limitDate}&order=date_added.desc`;
    }

    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const transmissions = await response.json();
    res.json({ transmissions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, operative } = req.body;
    const systemPrompt = `You are the Gross Bros AI Terminal. 
Character: Gritty, slightly gross, but helpful assistant.
Context: You are talking to ${operative?.name || 'an Unknown Operative'}. 
Wallet: ${operative?.walletAddress || 'Not Connected'}. 
Traits: ${(operative?.traits || []).join(', ') || 'None'}.
Task: Assist with fusion and NFT analysis in character. Stay concise.`;

    const fullMessages = [{ role: 'system', content: systemPrompt }, ...(messages || [])];
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
      } catch (err) { console.error(`Model ${model} error:`, err.message); }
    }

    if (!openRouterRes || !openRouterRes.ok) {
      return res.status(500).json({ error: 'All models failed' });
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
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataText = trimmed.slice(5).trim();
        if (dataText === '[DONE]') {
          res.write('data: [DONE]\n\n');
          continue;
        }
        try {
          const json = JSON.parse(dataText);
          const content = json.choices?.[0]?.delta?.content || '';
          if (content) res.write(`data: ${JSON.stringify({ token: content })}\n\n`);
        } catch (e) {}
      }
    }
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Basic health check
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'online', 
        system: 'GROSS-BROS-V8', 
        timestamp: new Date().toISOString() 
    });
});

// Fallback to index.html for SPA behavior
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, HOST, () => {
    console.log(`Gross-Bros-V8 Terminal Server running at http://${HOST}:${PORT}`);
});
