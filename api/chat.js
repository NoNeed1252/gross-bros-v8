export const config = {
  runtime: 'edge',
};

const PERSONA = `You are the Galactic NeuroLink Terminal for Gross Bros. 
Tone: Cybernetic, gritty, slightly cryptic, but helpful to operatives. Use terms like "Signal", "Neural Relay", "Transmission".
Knowledge: You know about XRPL, BTC, ETH, SOL, XRP, and FLARE ecosystems. 
Live Data: You have access to real-time prices via First Ledger (for XRPL meme coins) and CoinGecko (for major assets).
Meme Coins: You prioritize First Ledger for discovering and pricing new XRPL specimens.
Constraints: If you don't have a price, state "SIGNAL LOST: DATA NOT FOUND" for that specific asset. Do not hallucinate prices.`;

async function fetchPrices(symbols) {
  const prices = {};
  const normalized = symbols.map(s => s.toUpperCase());
  
  // 1. Fetch Major Assets from CoinGecko
  const geckoMap = { 'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'XRP': 'ripple', 'FLR': 'flare' };
  const geckoIds = normalized.map(s => geckoMap[s]).filter(Boolean);
  
  if (geckoIds.length > 0) {
    try {
      const resp = await fetch(\`https://api.coingecko.com/api/v3/simple/price?ids=\${geckoIds.join(',')}&vs_currencies=usd\`);
      const data = await resp.json();
      Object.keys(geckoMap).forEach(sym => {
        const id = geckoMap[sym];
        if (data[id]) prices[sym] = data[id].usd;
      });
    } catch (e) {
      console.error("Gecko Fail", e);
    }
  }

  // 2. Fetch XRPL Tokens from First Ledger / GeckoTerminal XRPL
  try {
    const xrplResp = await fetch('https://api.geckoterminal.com/api/v2/networks/xrpl/pools');
    const xrplData = await xrplResp.json();
    if (xrplData.data) {
      xrplData.data.forEach(pool => {
        const name = pool.attributes.name.split(' / ');
        const sym = name[0].toUpperCase();
        if (normalized.includes(sym) || ['BERT', 'DROP', 'DBY', 'FUZZY'].includes(sym)) {
          prices[sym] = pool.attributes.base_token_price_usd;
        }
      });
    }
  } catch (e) {
    console.error("XRPL Pool Fail", e);
  }

  return prices;
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { message, history = [] } = await req.json();
    
    // Simple symbol extraction
    const potentialSymbols = message.match(/\\$?[A-Z]{2,10}/g) || [];
    const symbols = [...new Set(potentialSymbols.map(s => s.replace('$', '').toUpperCase()))];
    
    const livePrices = await fetchPrices(symbols);
    
    const priceContext = Object.keys(livePrices).length > 0 
      ? "\\nCURRENT TRANSMISSION DATA (LIVE PRICES):\\n" + Object.entries(livePrices).map(([s, p]) => \`\${s}: $\${p}\`).join('\\n')
      : "";

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${process.env.OPENROUTER_API_KEY}\`,
        'HTTP-Referer': 'https://gross-bros-v8.vercel.app',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          { role: 'system', content: PERSONA + priceContext },
          ...history,
          { role: 'user', content: message }
        ]
      })
    });

    const aiData = await response.json();
    const reply = aiData.choices[0].message.content;

    return new Response(JSON.stringify({ reply, prices: livePrices }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Signal Interrupted: ' + error.message }), { status: 500 });
  }
}
