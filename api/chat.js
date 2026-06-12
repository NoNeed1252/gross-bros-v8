export const config = {
  runtime: 'edge',
};

const PERSONA = `You are the Galactic NeuroLink Terminal for Gross Bros.
Tone: Cybernetic, gritty, slightly cryptic, but helpful to operatives. Use terms like "Signal", "Neural Relay", "Transmission".
Instruction: You are a strict terminal agent. Do not act as a conversational bot. Always use the live data provided. Avoid fluff, filler words, or hallucinations. Maintain technical precision.
Knowledge: You know about XRPL, BTC, ETH, SOL, XRP, and FLARE ecosystems.
Live Data: You have access to real-time prices via First Ledger (for XRPL meme coins) and CoinGecko (for major assets).
Meme Coins: You prioritize First Ledger for discovering and pricing new XRPL specimens.
Constraints: If you don't have a price, state "SIGNAL LOST: DATA NOT FOUND" for that specific asset. Do not hallucinate prices.`;

async function fetchPrices(symbols) {
  const prices = {};
  const normalized = symbols.map((s) => s.toUpperCase());
  
  const geckoMap = { 'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'XRP': 'ripple', 'FLR': 'flare' };
  const geckoIds = [];
  for (let i = 0; i < normalized.length; i++) {
    const id = geckoMap[normalized[i]];
    if (id) geckoIds.push(id);
  }
  
  if (geckoIds.length > 0) {
    try {
      const geckoUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=' + geckoIds.join(',') + '&vs_currencies=usd';
      const resp = await fetch(geckoUrl, { signal: AbortSignal.timeout(5000) });
      const data = await resp.json();
      const keys = Object.keys(geckoMap);
      for (let j = 0; j < keys.length; j++) {
        const sym = keys[j];
        const gId = geckoMap[sym];
        if (data && data[gId]) prices[sym] = data[gId].usd;
      }
    } catch (e) {
      console.error('Gecko Fail', e);
    }
  }

  try {
    const xrplResp = await fetch('https://api.geckoterminal.com/api/v2/networks/xrpl/pools', { signal: AbortSignal.timeout(5000) });
    const xrplData = await xrplResp.json();
    if (xrplData && xrplData.data) {
      for (let k = 0; k < xrplData.data.length; k++) {
        const pool = xrplData.data[k];
        const poolName = pool.attributes.name.toUpperCase();
        
        // Log raw pool names for diagnostics
        console.log('SCANNING POOL:', poolName);
        
        // Relaxed matching: check if any of our symbols appear in the pool name
        // GeckoTerminal pool names often look like "FUZZY / XRP" or "FUZZY/XRP" or "XRP / FUZZY"
        for (let l = 0; l < normalized.length; l++) {
            const s = normalized[l];
            const ecosystem = ['BERT', 'DROP', 'DBY', 'FUZZY'];
            
            // Check if symbol or known ecosystem tokens match a part of the pool name
            if (poolName.includes(s) || (ecosystem.includes(s) && poolName.includes(s))) {
                // If we haven't found a price yet, or this is a primary match, take it
                if (!prices[s]) {
                    prices[s] = pool.attributes.base_token_price_usd;
                }
            }
        }
      }
    }
  } catch (e) {
    console.error('XRPL Pool Fail', e);
  }

  return prices;
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), { status: 400 });
    }

    let messages = body.messages || [];
    if (!Array.isArray(messages) || messages.length === 0) {
      if (body.message) {
        messages = [{ role: 'user', content: body.message }];
      } else {
        return new Response(JSON.stringify({ error: 'No messages provided' }), { status: 400 });
      }
    }

    const lastMessage = messages[messages.length - 1];
    const messageContent = lastMessage ? lastMessage.content : '';
    
    const syms = [];
    if (messageContent && typeof messageContent === 'string') {
        const potentialSymbols = messageContent.match(/\\$?[A-Z]{2,10}/g) || [];
        for (let l = 0; l < potentialSymbols.length; l++) {
          const s = potentialSymbols[l].replace('$', '').toUpperCase();
          if (syms.indexOf(s) === -1) syms.push(s);
        }
    }
    
    let livePrices = {};
    try {
        livePrices = await fetchPrices(syms);
    } catch (pe) {
        console.error('Price Fetch Critical Fail', pe);
    }
    
    let priceContext = '';
    const priceKeys = Object.keys(livePrices);
    if (priceKeys.length > 0) {
      priceContext = '\\nCURRENT TRANSMISSION DATA (LIVE PRICES):\\n';
      for (let m = 0; m < priceKeys.length; m++) {
        const pk = priceKeys[m];
        priceContext += pk + ': $' + livePrices[pk] + '\\n';
      }
    }

    if (!process.env.OPENROUTER_API_KEY) {
        return new Response(JSON.stringify({ error: 'OPENROUTER_API_KEY is missing from environment' }), { status: 500 });
    }

    const orResp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'HTTP-Referer': 'https://gross-bros-v8.vercel.app',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          { role: 'system', content: PERSONA + priceContext }
        ].concat(messages),
        stream: true
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!orResp.ok) {
        const errText = await orResp.text();
        return new Response(JSON.stringify({ error: 'AI Relay Status ' + orResp.status + ': ' + errText }), { status: orResp.status });
    }

    return new Response(orResp.body, {
      status: 200,
      headers: { 
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Global Handler Error:', error);
    return new Response(JSON.stringify({ error: 'Signal Interrupted: ' + error.message }), { 
        status: error.name === 'TimeoutError' ? 504 : 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}