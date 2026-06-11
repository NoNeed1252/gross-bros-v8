export const config = {
  runtime: 'edge',
};

const CRYPTO_KNOWLEDGE = "\nCORE XRPL KNOWLEDGE:\n- XRPL (XRP Ledger): A decentralized public blockchain. Fast (3-5 sec settlements), low cost, and carbon-neutral.\n- DEX (Decentralized Exchange): The XRPL has a built-in DEX for trading any issued currency.\n- Trustlines: Required to hold any token other than XRP. It's a security feature to prevent spam tokens.\n- Reserve Requirements: Accounts need a base reserve (10 XRP) and owner reserves (2 XRP per object/trustline/NFT offer).\n- NFToken (XLS-20): The native NFT standard on XRPL. Supports royalties (transfer fees) and minter/issuer separation.\n- AMM (Automated Market Maker): Recently activated on XRPL (XLS-30), allowing passive income via liquidity pools.\n\nGGB ECOSYSTEM & MEME TOKENS:\n- ATM: Automated Transmission Medium. A high-priority First Ledger meme specimen.\n- BERT: The fuel for the Gross Bros engine. High-octane slime-based utility.\n- DROP: Liquid energy utilized in the Fusion Lab. Essential for genetic stability.\n- DBY: The utility layer for experimental specimens. Used in high-level neural splicing.\n- RLUSD: Ripple's USD-pegged stablecoin, used for high-stability fusions.\n- FUZZY ($fuzzy): High-frequency neural static. A chaotic but valuable specimen asset.\n- PHNIX: Rebirth protocol. Used for reviving failed experiments and neural stabilization.\n- XRP ARMY: The frontline defense. Represents the collective strength of the ledger's elite forces.\n- PRINCE: Royal-tier specimen lineage. High-value asset in the GGB hierarchy.\n- BEARXRPH: Defensive market mitigation token. Built for survival in the harshest crypto winters.\n- PIDGEON: Information relay asset. Used for rapid-delivery signaling across the ledger.\n- SLT: Synthetic Ledger Toxin. Dangerous but potent when utilized in controlled fusions.\n- XRPH: High-density XRP derivative. Used in specialized industrial-grade ledger operations.\n- XRT: Extended Relay Token. The long-range communication backbone of the GGB network.\n\nTERMINOLOGY:\n- Cold Wallet: Offline storage (like Ledger or paper). Maximum safety.\n- Hot Wallet: Online app (like Xaman/XUMM). Convenient but connected to the net.\n- Keys/Seed: NEVER share these. If an operative asks, tell them it's a security breach.\n- Gas: XRPL doesn't call it 'gas' like Ethereum, but there are minimal network fees in XRP.\n- First Ledger: The primary breeding ground for new meme-specimens on XRPL.\n";

function extractMentionedSymbols(messages) {
  const text = messages.map(m => m.content).join(' ').toUpperCase();
  const tickerRegex = /\$?[A-Z]{3,6}\b/g;
  const matches = text.match(tickerRegex) || [];
  const found = matches.map(m => m.replace('$', ''));
  
  const knownSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'XLM', 'HBAR', 'ADA', 'DOT', 'DOGE', 'SHIB', 'PEPE', 'LINK', 'MATIC', 'ALGO', 'ATM', 'BERT', 'DROP', 'DBY', 'FUZZY', 'RLUSD', 'PHNIX', 'ARMY', 'PRINCE', 'BEARXRPH', 'PIDGEON', 'SLT', 'XRPH', 'XRT'];
  
  const combined = Array.from(new Set([...found, ...knownSymbols.filter(sym => text.includes(sym))]));
  return combined;
}

const SYMBOL_MAP = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'XRP': 'ripple',
  'XLM': 'stellar', 'HBAR': 'hedera-hashgraph', 'ADA': 'cardano', 'DOT': 'polkadot',
  'DOGE': 'dogecoin', 'SHIB': 'shiba-inu', 'PEPE': 'pepe', 'LINK': 'chainlink',
  'MATIC': 'polygon-ecosystem-token', 'ALGO': 'algorand', 'LTC': 'litecoin',
  'BCH': 'bitcoin-cash', 'AVAX': 'avalanche-2', 'SUI': 'sui', 'APT': 'aptos'
};

const XRPL_TOKEN_ADDRESSES = {
  'ATM': 'raqVwqakELDXTXmU8FQw53fJ9Sehr7hDTR',
  'BERT': 'rNoNeed1252BERTaddressHERE...',
  'DROP': 'rNoNeed1252DROPaddressHERE...'
};

async function getLivePrices(mentionedSymbols = []) {
  const prices = {};
  mentionedSymbols.forEach(sym => { prices[sym] = null; });
  const idsToFetch = [];
  mentionedSymbols.forEach(sym => { if (SYMBOL_MAP[sym]) idsToFetch.push(SYMBOL_MAP[sym]); });
  ['ripple', 'bitcoin', 'ethereum', 'solana'].forEach(id => { if (!idsToFetch.includes(id)) idsToFetch.push(id); });

  try {
    const fetchPromises = [
      fetch('https://api.geckoterminal.com/api/v2/networks/xrpl/pools').then(r => r.json()),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=' + idsToFetch.join(',') + '&vs_currencies=usd').then(r => r.json())
    ];

    const dexscreenerSymbols = mentionedSymbols.filter(sym => !SYMBOL_MAP[sym] && !XRPL_TOKEN_ADDRESSES[sym]);
    dexscreenerSymbols.forEach(sym => {
      fetchPromises.push(fetch('https://api.dexscreener.com/latest/dex/search?q=' + sym).then(r => r.json()).then(data => ({ sym, type: 'dex', data })));
    });

    const results = await Promise.allSettled(fetchPromises);
    
    const dexRes = results[0].status === 'fulfilled' ? results[0].value : null;
    const geckoRes = results[1].status === 'fulfilled' ? results[1].value : null;

    if (geckoRes) {
      Object.keys(SYMBOL_MAP).forEach(sym => {
        const id = SYMBOL_MAP[sym];
        if (geckoRes[id] && geckoRes[id].usd) prices[sym] = geckoRes[id].usd.toString();
      });
    }

    if (dexRes && dexRes.data) {
      const pools = dexRes.data;
      mentionedSymbols.forEach(sym => {
        const pool = pools.find(p => {
          const nameMatch = p.attributes && p.attributes.name && p.attributes.name.toUpperCase().includes(sym.toUpperCase());
          const addressMatch = XRPL_TOKEN_ADDRESSES[sym] && p.attributes && p.attributes.address && p.attributes.address.toLowerCase().includes(XRPL_TOKEN_ADDRESSES[sym].toLowerCase());
          return nameMatch || addressMatch;
        });
        if (pool && !prices[sym]) {
          prices[sym] = parseFloat(pool.attributes.base_token_price_usd).toFixed(10);
        }
      });
    }

    results.slice(2).forEach(res => {
      if (res.status === 'fulfilled' && res.value && res.value.type === 'dex') {
        const sym = res.value.sym;
        const data = res.value.data;
        if (data.pairs && data.pairs.length > 0) {
          const bestPair = data.pairs[0];
          prices[sym] = bestPair.priceUsd + ' (' + bestPair.chainId.toUpperCase() + ') | Vol: $' + (bestPair.volume ? bestPair.volume.h24 : '0') + ' | 24h: ' + (bestPair.priceChange ? bestPair.priceChange.h24 : '0') + '%';
        }
      }
    });
    
    if (!prices['ATM'] && mentionedSymbols.includes('ATM')) {
      try {
        const atmRes = await fetch('https://api.geckoterminal.com/api/v2/networks/xrpl/tokens/raqVwqakELDXTXmU8FQw53fJ9Sehr7hDTR/pools').then(r => r.json());
        if (atmRes && atmRes.data && atmRes.data[0] && atmRes.data[0].attributes && atmRes.data[0].attributes.base_token_price_usd) {
          prices['ATM'] = parseFloat(atmRes.data[0].attributes.base_token_price_usd).toFixed(10);
        }
      } catch (e) {}
    }

    if (!prices.XRP || !prices.BTC) {
      const fb = await Promise.allSettled([
        fetch('https://api.coinbase.com/v2/prices/XRP-USD/spot').then(r => r.json()),
        fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot').then(r => r.json())
      ]);
      if (fb[0].status === 'fulfilled' && fb[0].value && fb[0].value.data && fb[0].value.data.amount) prices.XRP = fb[0].value.data.amount;
      if (fb[1].status === 'fulfilled' && fb[1].value && fb[1].value.data && fb[1].value.data.amount) prices.BTC = fb[1].value.data.amount;
    }
  } catch (e) {}
  return prices;
}

async function getHoldings(address) {
  if (!address) return [];
  const BITHOMP_TOKEN = process.env.BITHOMP_API_KEY || "95b64250-f24f-4654-9b4b-b155a3a6867b";
  const issuer = "rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY";
  const taxon = "1";
  try {
    const url = "https://bithomp.com/api/v2/nfts?list=nfts&issuer=" + issuer + "&taxon=" + taxon + "&owner=" + address;
    const res = await fetch(url, { headers: { 'x-bithomp-token': BITHOMP_TOKEN } });
    const data = await res.json();
    return data.nfts || [];
  } catch (e) { return []; }
}

async function getSpecimensBackstories(tokenIds) {
  if (!tokenIds || tokenIds.length === 0) return [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bwvnhlmvyjuowyyltraw.supabase.co";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseKey) return [];
  try {
    const filter = tokenIds.map(id => "token_id.eq." + id).join(',');
    const url = supabaseUrl + "/rest/v1/specimens?select=name,backstory,token_id&or=(" + filter + ")";
    const res = await fetch(url, { headers: { 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey } });
    return await res.json();
  } catch (e) { return []; }
}

export default async function handler(req) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers });

  try {
    const body = await req.json();
    const messages = body.messages;
    const operative = body.operative;
    const walletAddress = operative ? operative.walletAddress : null;
    const activeSpecimenName = (operative && operative.traits ? operative.traits[0] : null) || "Unknown Specimen";
    const mentionedSymbols = extractMentionedSymbols(messages || []);
    const holdingsPrices = await Promise.all([getHoldings(walletAddress), getLivePrices(mentionedSymbols)]);
    const holdings = holdingsPrices[0];
    const prices = holdingsPrices[1];
    const tokenIds = holdings.map(nft => nft.nftokenID);
    const backstories = await getSpecimensBackstories(tokenIds);
    const activeBackstoryObj = backstories.find(s => s.name === activeSpecimenName);
    
    let identityContext = '';
    if (activeBackstoryObj) {
      identityContext = "YOU ARE CURRENTLY MANIFESTING AS: " + activeBackstoryObj.name + ".\nCORE IDENTITY & MEMORIES: " + activeBackstoryObj.backstory + "\nYou must speak strictly in the voice and persona of this specific specimen.";
    } else {
      const isPrototype = activeSpecimenName.includes('001') || activeSpecimenName.includes('PROTOTYPE');
      const isElite = activeSpecimenName.includes('PRINCE') || activeSpecimenName.includes('ELITE');
      identityContext = "YOU ARE CURRENTLY MANIFESTING AS: " + activeSpecimenName + ".\nCORE IDENTITY (Fallback Protocol): " + (isPrototype ? 'You are a twitchy, paranoid early-stage mutation.' : isElite ? 'You are an arrogant, royal-tier specimen.' : 'You are a cynical survivor of the XRP-7 pits.') + "\nYour personality is online.";
    }

    const otherHoldings = backstories.filter(s => s.name !== activeSpecimenName);
    const walletContext = otherHoldings.length > 0 ? "USER WALLET ASSETS: " + otherHoldings.map(s => s.name).join(' | ') : 'No other Gross Bros held.';
    
    const priceStrings = Object.entries(prices)
      .map(entry => {
        const sym = entry[0];
        const val = entry[1];
        const valStr = val ? '$' + val : 'GUNKED';
        return sym + ': ' + valStr;
      })
      .join(' | ');

    const systemPrompt = "### CORE IDENTITY PROTOCOL\n" + identityContext + "\n\n### BEHAVIORAL MANDATE\n- You are a Gross Bro, gritty and intelligent.\n- Use slang like 'Alpha', 'Signal', 'Neural Breach', 'Gunk'.\n- Stay concise, cynical, and technically accurate.\n- Address the user as Alpha.\n\n### LIVE MARKET DATA\n" + priceStrings + "\n\n### USER CONTEXT\n- Wallet: " + (walletAddress || 'Not Connected') + "\n- " + walletContext + "\n\n### TASK\n- Ground evaluations in live market data. If a price is low, it's 'gunked'. If high, it's 'neural-surging'.\n- Relate crypto concepts back to the 'GGB Energy Sector'.";

    const fullMessages = [{ role: 'system', content: systemPrompt }].concat(messages || []);
    if (!process.env.OPENROUTER_API_KEY) return new Response(JSON.stringify({ error: 'API Key Missing' }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });

    let openRouterRes;
    const models = ['meta-llama/llama-3.1-70b-instruct', 'meta-llama/llama-3.1-8b-instruct:free'];
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': "Bearer " + process.env.OPENROUTER_API_KEY, 'HTTP-Referer': 'https://gross-bros.vercel.app', 'X-Title': 'Gross Bros Terminal', 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model, messages: fullMessages, stream: true }),
      });
      if (openRouterRes.ok) break;
    }

    if (!openRouterRes || !openRouterRes.ok) {
       return new Response(JSON.stringify({ error: 'Signal Breach: OpenRouter Offline' }), { status: 502, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = openRouterRes.body.getReader();
        let buffer = '';
        try {
          while (true) {
            const result = await reader.read();
            const done = result.done;
            const value = result.value;
            if (done) break;
            buffer += decoder.decode(value);
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;
              const dataText = trimmed.slice(5).trim();
              if (dataText === '[DONE]') { controller.enqueue(encoder.encode('data: [DONE]\n\n')); continue; }
              try {
                const json = JSON.parse(dataText);
                const content = (json.choices && json.choices[0] && json.choices[0].delta) ? json.choices[0].delta.content : '';
                if (content) controller.enqueue(encoder.encode("data: " + JSON.stringify({ token: content }) + "\n\n"));
              } catch (e) {}
            }
          }
        } catch (e) {} finally { controller.close(); }
      },
    });

    return new Response(stream, { headers: { ...headers, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
  } catch (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }); }
}
