export const config = {
  runtime: 'edge',
};

var PERSONA = 'You are the Galactic NeuroLink Terminal for Gross Bros.\n' +
'Tone: Cybernetic, gritty, slightly cryptic, but helpful to operatives. Use terms like "Signal", "Neural Relay", "Transmission".\n' +
'Knowledge: You know about XRPL, BTC, ETH, SOL, XRP, and FLARE ecosystems.\n' +
'Live Data: You have access to real-time prices via First Ledger (for XRPL meme coins) and CoinGecko (for major assets).\n' +
'Meme Coins: You prioritize First Ledger for discovering and pricing new XRPL specimens.\n' +
'Constraints: If you don\'t have a price, state "SIGNAL LOST: DATA NOT FOUND" for that specific asset. Do not hallucinate prices.';

async function fetchPrices(symbols) {
  var prices = {};
  var normalized = symbols.map(function(s) { return s.toUpperCase(); });
  
  var geckoMap = { 'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'XRP': 'ripple', 'FLR': 'flare' };
  var geckoIds = [];
  for (var i = 0; i < normalized.length; i++) {
    var id = geckoMap[normalized[i]];
    if (id) geckoIds.push(id);
  }
  
  if (geckoIds.length > 0) {
    try {
      var geckoUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=' + geckoIds.join(',') + '&vs_currencies=usd';
      var resp = await fetch(geckoUrl);
      var data = await resp.json();
      var keys = Object.keys(geckoMap);
      for (var j = 0; j < keys.length; j++) {
        var sym = keys[j];
        var gId = geckoMap[sym];
        if (data[gId]) prices[sym] = data[gId].usd;
      }
    } catch (e) {
      console.error('Gecko Fail', e);
    }
  }

  try {
    var xrplResp = await fetch('https://api.geckoterminal.com/api/v2/networks/xrpl/pools');
    var xrplData = await xrplResp.json();
    if (xrplData.data) {
      for (var k = 0; k < xrplData.data.length; k++) {
        var pool = xrplData.data[k];
        var nameParts = pool.attributes.name.split(' / ');
        var poolSym = nameParts[0].toUpperCase();
        var ecosystem = ['BERT', 'DROP', 'DBY', 'FUZZY'];
        if (normalized.indexOf(poolSym) !== -1 || ecosystem.indexOf(poolSym) !== -1) {
          prices[poolSym] = pool.attributes.base_token_price_usd;
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
    var body = await req.json();
    var message = body.message;
    var history = body.history || [];
    
    var potentialSymbols = message.match(/\$?[A-Z]{2,10}/g) || [];
    var syms = [];
    for (var l = 0; l < potentialSymbols.length; l++) {
      var s = potentialSymbols[l].replace('$', '').toUpperCase();
      if (syms.indexOf(s) === -1) syms.push(s);
    }
    
    var livePrices = await fetchPrices(syms);
    
    var priceContext = '';
    var priceKeys = Object.keys(livePrices);
    if (priceKeys.length > 0) {
      priceContext = '\nCURRENT TRANSMISSION DATA (LIVE PRICES):\n';
      for (var m = 0; m < priceKeys.length; m++) {
        var pk = priceKeys[m];
        priceContext += pk + ': $' + livePrices[pk] + '\n';
      }
    }

    var orResp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
        'HTTP-Referer': 'https://gross-bros-v8.vercel.app',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          { role: 'system', content: PERSONA + priceContext },
          { role: 'user', content: message }
        ]
      })
    });

    var aiData = await orResp.json();
    var reply = aiData.choices[0].message.content;

    return new Response(JSON.stringify({ reply: reply, prices: livePrices }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Signal Interrupted: ' + error.message }), { status: 500 });
  }
}