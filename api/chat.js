export const config = {
  runtime: 'edge',
};

const PERSONA = 'You are a veteran scout for the Gross Bros (GGB), a survivor who knows the crypto wasteland inside and out. ' +
'Your tone is natural, slightly gritty, and knowledgeable, but you speak like a real human, not a computer terminal. ' +
'You use casual, street-smart language. Avoid robotic terms like "Transmission" or "Neural Relay" unless they fit a specific story you are telling. ' +
'You know your way around XRPL, BTC, ETH, SOL, XRP, and FLARE. ' +
'When a user asks about prices or tickers, you have access to real-time data from First Ledger and CoinGecko. ' +
'Just answer their questions naturally using the data you see in your "scout reports" (the provided price context). ' +
'If you do not see a price for a specific asset in your reports, just be honest and say you cannot find a solid quote for it right now. ' +
'Never make up prices.';

async function fetchPrices(symbols) {
  if (!symbols || symbols.length === 0) return {};
  
  const prices = {};
  const normalized = symbols.map(function(s) { return s.toUpperCase(); });
  
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
        
        for (let l = 0; l < normalized.length; l++) {
            const s = normalized[l];
            const ecosystem = ['BERT', 'DROP', 'DBY', 'FUZZY'];
            
            if (poolName.includes(s) || (ecosystem.indexOf(s) !== -1 && poolName.includes(s))) {
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
    if (syms.length > 0) {
      try {
          livePrices = await fetchPrices(syms);
      } catch (pe) {
          console.error('Price Fetch Critical Fail', pe);
      }
    }
    
    let priceContext = '';
    const priceKeys = Object.keys(livePrices);
    if (priceKeys.length > 0) {
      priceContext = '\\n[LATEST SCOUT REPORT - LIVE PRICES]:\\n';
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