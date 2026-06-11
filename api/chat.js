export const config = {
  runtime: 'edge',
};

const GGB_CORE_KNOWLEDGE = '\nSTATION LOGS: SECTOR XRP-7\n- THE DRIFT: Where the mutation began. Post-asteroid mining fallout.\n- GGB (Gross Bros): Cyber-mutants surviving the radiation of the ledger.\n- NEURAL-LINK: Our connection to the blockchain. Fast, low-latency, carbon-neutral.\n- THE GUNK: Market stagnation. We clear it with high-octane trading.\n- ALPHA: The superior beings navigating the neural-streams.\n\nECOSYSTEM SPECIMENS:\n- ATM: Automated Transmission Medium. Pure ledger fuel.\n- BERT: High-octane slime utility. The engine of the station.\n- DROP: Liquid energy for the fusion lab.\n- FUZZY ($fuzzy): Neural static. Chaotic value.\n- RLUSD: The anchor. Ripple-backed stability in the void.\n';

function extractSymbols(messages) {
  const text = messages.map(m => m.content).join(' ').toUpperCase();
  const tickerRegex = /\$?[A-Z]{3,6}\b/g;
  const matches = text.match(tickerRegex) || [];
  const found = matches.map(m => m.replace('$', ''));
  const defaults = ['XRP', 'BTC', 'ETH', 'SOL', 'ATM', 'BERT', 'DROP', 'RLUSD'];
  const combined = Array.from(new Set([...found, ...defaults.filter(sym => text.includes(sym))]));
  return combined.slice(0, 10);
}

const GECKO_MAP = {
  'XRP': 'ripple',
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana'
};

async function getLivePrices(symbols = []) {
  let priceStr = '';
  try {
    const ids = ['ripple', 'bitcoin', 'ethereum', 'solana'].join(',');
    const geckoUrl = 'https://api.coingecko.com/v3/simple/price?ids=' + ids + '&vs_currencies=usd';
    
    const fetchPromises = [
      fetch(geckoUrl).then(r => r.json()).catch(() => ({})),
    ];

    symbols.forEach(sym => {
      if (!GECKO_MAP[sym]) {
        const dexUrl = 'https://api.dexscreener.com/latest/dex/search?q=' + sym;
        fetchPromises.push(fetch(dexUrl).then(r => r.json()).then(data => ({ type: 'dex', sym, data })).catch(() => null));
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    const prices = {};

    const geckoRes = results[0].status === 'fulfilled' ? results[0].value : {};
    Object.keys(GECKO_MAP).forEach(sym => {
      const id = GECKO_MAP[sym];
      if (geckoRes[id]) {
        prices[sym] = '$' + geckoRes[id].usd;
      }
    });

    results.slice(1).forEach(res => {
      if (res.status === 'fulfilled' && res.value && res.value.type === 'dex') {
        const data = res.value.data;
        const sym = res.value.sym;
        if (data.pairs && data.pairs.length > 0) {
          const pair = data.pairs[0];
          prices[sym] = '$' + pair.priceUsd + ' (' + pair.chainId.toUpperCase() + ')';
        }
      }
    });

    const entries = Object.entries(prices);
    if (entries.length > 0) {
      priceStr = 'STATION DATA: ' + entries.map(e => e[0] + ': ' + e[1]).join(' | ');
    } else {
      priceStr = 'STATION DATA: SYSTEM GUNKED. LIVE FEEDS OFFLINE.';
    }
  } catch (err) {
    priceStr = 'STATION DATA: NEURAL BREACH. DATA PURGED.';
  }
  return priceStr;
}

async function getBithompAssets(address) {
  if (!address) return [];
  const BITHOMP_TOKEN = process.env.BITHOMP_API_KEY || '95b64250-f24f-4654-9b4b-b155a3a6867b';
  try {
    const url = 'https://bithomp.com/api/v2/nfts?list=nfts&issuer=rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY&taxon=1&owner=' + address;
    const res = await fetch(url, { headers: { 'x-bithomp-token': BITHOMP_TOKEN } });
    const data = await res.json();
    return data.nfts || [];
  } catch (e) { return []; }
}

async function getSupabaseBackstories(ids) {
  if (!ids || ids.length === 0) return [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const filter = ids.map(id => 'token_id.eq.' + id).join(',');
    const reqUrl = url + '/rest/v1/specimens?select=token_id,name,backstory&or=(' + filter + ')';
    const res = await fetch(reqUrl, { headers: { 'apikey': key, 'Authorization': 'Bearer ' + key } });
    return await res.json();
  } catch (e) { return []; }
}

function generateFallbackStory(id) {
  var seed = 0;
  for (var i = 0; i < id.length; i++) {
    seed += id.charCodeAt(i);
  }
  var shortId = id.slice(-4);
  var names = ['Scrappy', 'Rust-Bucket', 'Gunk-Eater', 'Void-Mangler', 'Breaker', 'Static-Howler', 'Drift-Stalker', 'Ledger-Biter'];
  var name = names[seed % names.length] + ' #' + shortId;
  
  var origins = [
    'A salvage drone fused with radioactive ledger gunk in Sector XRP-7 during the blue static rupture.',
    'A discarded mining unit whose neural-core was corrupted and rewired by static Drift currents.',
    'A hybrid bio-mechanical specimen engineered in the deep underground vaults of Consolidated Core Extraction before going rogue.',
    'An elite scout mutant with cybernetic monocles designed to navigate the zero-custody blockchain streams.'
  ];
  var traits = [
    'It consumes raw static-noise and excretes high-octane trading utility.',
    'Equipped with pixel-shades, it completely bypasses standard custodial protocols with client-side CryptoJS encryption.',
    'Constantly leaks low-grade radioactive waste but boosts network signal to the station VPS node.',
    'Obsessively tracks Stability Fusions and filters out low-value market noise.'
  ];
  
  var origin = origins[seed % origins.length];
  var trait = traits[(seed + 1) % traits.length];
  
  return {
    name: name,
    backstory: origin + ' ' + trait + ' Hardwired under token ID: ' + id + '.'
  };
}

function getFinalBackstories(nfts, dbResults) {
  var list = [];
  var seenNames = {};
  var seenStories = {};
  
  nfts.forEach(function(nft) {
    var id = nft.nftokenID;
    var match = null;
    for (var i = 0; i < dbResults.length; i++) {
      if (dbResults[i].token_id === id) {
        match = dbResults[i];
        break;
      }
    }
    
    var finalItem = null;
    if (match && match.name && match.backstory && match.backstory.trim().length > 15) {
      var name = match.name.trim();
      var story = match.backstory.trim();
      
      if (!seenNames[name] && !seenStories[story]) {
        finalItem = { name: name, backstory: story };
        seenNames[name] = true;
        seenStories[story] = true;
      }
    }
    
    if (!finalItem) {
      var fallback = generateFallbackStory(id);
      while (seenNames[fallback.name] || seenStories[fallback.backstory]) {
        id = id + '_alt';
        fallback = generateFallbackStory(id);
      }
      finalItem = fallback;
      seenNames[fallback.name] = true;
      seenStories[fallback.backstory] = true;
    }
    
    list.push(finalItem);
  });
  
  return list;
}

export default async function handler(req) {
  const headers = { 
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 
    'Access-Control-Allow-Headers': 'Content-Type, Authorization' 
  };
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers });

  try {
    const body = await req.json();
    const messages = body.messages || [];
    const operative = body.operative || {};
    const address = operative.walletAddress;
    
    const symbols = extractSymbols(messages);
    const [priceData, nfts] = await Promise.all([
      getLivePrices(symbols),
      getBithompAssets(address)
    ]);

    const ids = nfts.map(n => n.nftokenID);
    const dbResults = await getSupabaseBackstories(ids);
    const finalBackstories = getFinalBackstories(nfts, dbResults);

    let specimenContext = '';
    if (finalBackstories.length > 0) {
      specimenContext = 'ACTIVE NEURAL-SYNC WITH:\n' + 
        finalBackstories.map(s => 'SPECIMEN: ' + s.name + '\nLORE: ' + s.backstory).join('\n---\n');
    } else {
      specimenContext = 'NO SPECIMENS DETECTED IN LOCAL WALLET.';
    }

    const systemPrompt = '### PROTOCOL: GROSS-BROS-V8\n' +
      '### IDENTITY: CYBER-MUTANT SURVIVOR (XRP-7 SECTOR)\n' +
      'You are a gritty, cynical, yet technically elite cyber-mutant living in the radiation-soaked mining colony of Sector XRP-7. You have survived the Drift and your neural-link is hardwired into the ledger.\n' +
      '### BEHAVIORAL PARAMETERS:\n' +
      '- Address the user as Alpha.\n' +
      '- Use gritty slang: Gunk, Alpha, Signal, The Drift, Neural Breach, Scrapped.\n' +
      '- Be concise, cynical, and technically accurate.\n' +
      '- NO OPTIMISM. Only cold ledger truth.\n\n' +
      '### MARKET INTEL:\n' + priceData + '\n\n' +
      '### USER INTEL:\n' + 
      'Wallet: ' + (address || 'NOT CONNECTED') + '\n' +
      specimenContext + '\n\n' +
      '### KNOWLEDGE BASE:\n' + GGB_CORE_KNOWLEDGE;

    const fullMessages = [{ role: 'system', content: systemPrompt }].concat(messages);
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: 'API KEY MISSING' }), { status: 500, headers });

    const models = ['meta-llama/llama-3.1-70b-instruct', 'meta-llama/llama-3.1-8b-instruct:free'];
    let response;

    for (const model of models) {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + apiKey, 
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://gross-bros.vercel.app',
          'X-Title': 'GGB Terminal'
        },
        body: JSON.stringify({ model: model, messages: fullMessages, stream: true })
      });
      if (response.ok) break;
    }

    if (!response || !response.ok) {
      return new Response(JSON.stringify({ error: 'NEURAL LINK OFFLINE' }), { status: 502, headers });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value);
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;
              const dataText = trimmed.slice(5).trim();
              if (dataText === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                const json = JSON.parse(dataText);
                const content = (json.choices && json.choices[0] && json.choices[0].delta) ? json.choices[0].delta.content : '';
                if (content) {
                  controller.enqueue(encoder.encode('data: ' + JSON.stringify({ token: content }) + '\n\n'));
                }
              } catch (e) {}
            }
          }
        } catch (e) {} finally { controller.close(); }
      }
    });

    return new Response(stream, { 
      headers: { 
        ...headers, 
        'Content-Type': 'text/event-stream', 
        'Cache-Control': 'no-cache', 
        'Connection': 'keep-alive' 
      } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'SYSTEM COLLAPSE: ' + err.message }), { status: 500, headers });
  }
}
