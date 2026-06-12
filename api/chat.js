export const config = {
  runtime: 'edge',
};

const CRYPTO_KNOWLEDGE = '\nCORE XRPL KNOWLEDGE:\n' +
'- XRPL (XRP Ledger): A decentralized public blockchain. Fast (3-5 sec settlements), low cost, and carbon-neutral.\n' +
'- DEX (Decentralized Exchange): The XRPL has a built-in DEX for trading any issued currency.\n' +
'- Trustlines: Required to hold any token other than XRP. It is a security feature to prevent spam tokens.\n' +
'- Reserve Requirements: Accounts need a base reserve (10 XRP) and owner reserves (2 XRP per object/trustline/NFT offer).\n' +
'- NFToken (XLS-20): The native NFT standard on XRPL. Supports royalties (transfer fees) and minter/issuer separation.\n' +
'- AMM (Automated Market Maker): Recently activated on XRPL (XLS-30), allowing passive income via liquidity pools.\n\n' +
'GGB ECOSYSTEM & MEME TOKENS:\n' +
'- ATM: Automated Transmission Medium. A high-priority First Ledger meme specimen.\n' +
'- BERT: The fuel for the Gross Bros engine. High-octane slime-based utility.\n' +
'- DROP: Liquid energy utilized in the Fusion Lab. Essential for genetic stability.\n' +
'- DBY: The utility layer for experimental specimens. Used in high-level neural splicing.\n' +
'- RLUSD: Ripple\'s USD-pegged stablecoin, used for high-stability fusions.\n' +
'- FUZZY ($fuzzy): High-frequency neural static. A chaotic but valuable specimen asset.\n' +
'- PHNIX: Rebirth protocol. Used for reviving failed experiments and neural stabilization.\n' +
'- XRP ARMY: The frontline defense. Represents the collective strength of the ledger\'s elite forces.\n' +
'- PRINCE: Royal-tier specimen lineage. High-value asset in the GGB hierarchy.\n' +
'- BEARXRPH: Defensive market mitigation token. Built for survival in the harshest crypto winters.\n' +
'- PIDGEON: Information relay asset. Used for rapid-delivery signaling across the ledger.\n' +
'- SLT: Synthetic Ledger Toxin. Dangerous but potent when utilized in controlled fusions.\n' +
'- XRPH: High-density XRP derivative. Used in specialized industrial-grade ledger operations.\n' +
'- XRT: Extended Relay Token. The long-range communication backbone of the GGB network.\n\n' +
'TERMINOLOGY:\n' +
'- Cold Wallet: Offline storage (like Ledger or paper). Maximum safety.\n' +
'- Hot Wallet: Online app (like Xaman/XUMM). Convenient but connected to the net.\n' +
'- Keys/Seed: NEVER share these. If an operative asks, tell them it\'s a security breach.\n' +
'- Gas: XRPL doesn\'t call it "gas" like Ethereum, but there are minimal network fees in XRP.\n' +
'- First Ledger: The primary breeding ground for new meme-specimens on XRPL.\n';

function extractMentionedSymbols(messages) {
  const text = messages.map(m => m.content).join(' ').toUpperCase();
  const commonSymbols = [
    'BTC', 'ETH', 'SOL', 'XRP', 'XLM', 'HBAR', 'ADA', 'DOT', 'DOGE', 'SHIB', 'PEPE', 
    'LINK', 'MATIC', 'ALGO', 'ATM', 'BERT', 'DROP', 'DBY', 'FUZZY', 'BOO', '666', 
    'PHNIX', 'RLUSD', 'ARMY', 'PRINCE', 'BEARXRPH', 'PIDGEON', 'SLT', 'XRPH', 'XRT'
  ];
  const found = commonSymbols.filter(sym => text.indexOf(sym) !== -1);
  
  const dollarRegex = /\$([A-Z0-9]{2,10})/g;
  let match;
  while ((match = dollarRegex.exec(text)) !== null) {
    const sym = match[1];
    if (found.indexOf(sym) === -1) {
      found.push(sym);
    }
  }
  
  return found;
}

const SYMBOL_MAP = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'XRP': 'ripple',
  'XLM': 'stellar', 'HBAR': 'hedera-hashgraph', 'ADA': 'cardano', 'DOT': 'polkadot',
  'DOGE': 'dogecoin', 'SHIB': 'shiba-inu', 'PEPE': 'pepe', 'LINK': 'chainlink',
  'MATIC': 'polygon-ecosystem-token', 'ALGO': 'algorand'
};

const TOKEN_ADDRESSES = {
  '666': 'rMvG39q278iR8S17GpqH7Sya8bHhX8a3a3/3636360000000000000000000000000000000000',
  'ATM': 'rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY/41544D0000000000000000000000000000000000',
  'FUZZY': 'rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY/46555A5A59000000000000000000000000000000',
  'BOO': 'rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY/424F4F0000000000000000000000000000000000'
};

async function getLivePrices(mentionedSymbols = []) {
  const prices = {
    XRP: null, BTC: null, ETH: null, SOL: null,
    ATM: null, BERT: null, DROP: null, DBY: null, RLUSD: null,
    FUZZY: null, PHNIX: null, ARMY: null, PRINCE: null,
    BEARXRPH: null, PIDGEON: null, SLT: null, XRPH: null, XRT: null,
    BOO: null, '666': null
  };

  const idsToFetch = ['ripple', 'bitcoin', 'ethereum', 'solana'];
  mentionedSymbols.forEach(sym => {
    if (SYMBOL_MAP[sym] && idsToFetch.indexOf(SYMBOL_MAP[sym]) === -1) {
      idsToFetch.push(SYMBOL_MAP[sym]);
    }
  });

  try {
    const fetchPromises = [
      fetch('https://api.geckoterminal.com/api/v2/networks/xrpl/pools').then(r => r.json()),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=' + idsToFetch.join(',') + '&vs_currencies=usd').then(r => r.json()),
      fetch('https://api.geckoterminal.com/api/v2/networks/xrpl/pools?page=2').then(r => r.json())
    ];

    Object.keys(TOKEN_ADDRESSES).forEach(sym => {
      const addr = TOKEN_ADDRESSES[sym];
      fetchPromises.push(
        fetch('https://api.geckoterminal.com/api/v2/networks/xrpl/tokens/' + addr + '/pools')
          .then(r => r.json())
          .then(data => ({ type: 'token_pools', sym: sym, data: data }))
      );
    });

    const results = await Promise.allSettled(fetchPromises);

    const dexRes = results[0];
    const geckoRes = results[1];
    const dexRes2 = results[2];

    if (geckoRes.status === 'fulfilled' && geckoRes.value) {
      Object.keys(SYMBOL_MAP).forEach(sym => {
        const id = SYMBOL_MAP[sym];
        if (geckoRes.value[id] && geckoRes.value[id].usd) {
          prices[sym] = geckoRes.value[id].usd.toString();
        }
      });
    }

    if (!prices.XRP || !prices.BTC) {
      const fallbackPromises = [];
      if (!prices.XRP) fallbackPromises.push(fetch('https://api.coinbase.com/v2/prices/XRP-USD/spot').then(r => r.json()).then(data => ({ sym: 'XRP', val: data && data.data ? data.data.amount : null })));
      if (!prices.BTC) fallbackPromises.push(fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot').then(r => r.json()).then(data => ({ sym: 'BTC', val: data && data.data ? data.data.amount : null })));
      
      const fbResults = await Promise.allSettled(fallbackPromises);
      fbResults.forEach(res => {
        if (res.status === 'fulfilled' && res.value.val) {
          prices[res.value.sym] = res.value.val;
        }
      });
    }

    const processPools = (poolData) => {
      if (poolData && poolData.data) {
        const pools = poolData.data;
        const findPrice = (symbol) => {
          const pool = pools.find(p => p.attributes && p.attributes.name && p.attributes.name.toUpperCase().indexOf(symbol.toUpperCase()) !== -1);
          return pool ? pool.attributes.base_token_price_usd : null;
        };

        const coreGGB = [
          'ATM', 'BERT', 'DROP', 'DBY', 'RLUSD', 'FUZZY', 'PHNIX', 
          'ARMY', 'PRINCE', 'BEARXRPH', 'PIDGEON', 'SLT', 'XRPH', 'XRT', 
          'BOO', '666'
        ];
        
        coreGGB.forEach(sym => {
          const p = findPrice(sym);
          if (p && !prices[sym]) prices[sym] = parseFloat(p).toFixed(10);
        });
        
        mentionedSymbols.forEach(sym => {
          if (!prices[sym]) {
            const p = findPrice(sym);
            if (p) prices[sym] = parseFloat(p).toFixed(10);
          }
        });
      }
    };

    if (dexRes.status === 'fulfilled') processPools(dexRes.value);
    if (dexRes2.status === 'fulfilled') processPools(dexRes2.value);

    for (let i = 3; i < results.length; i++) {
      const res = results[i];
      if (res.status === 'fulfilled' && res.value.type === 'token_pools') {
        const sym = res.value.sym;
        if (!prices[sym]) {
          processPools(res.value.data);
        }
      }
    }

  } catch (e) {
    console.error('Price fetch error:', e);
  }
  return prices;
}

async function getHoldings(address) {
  if (!address) return [];
  const BITHOMP_TOKEN = process.env.BITHOMP_API_KEY || "95b64250-f24f-4654-9b4b-b155a3a6867b";
  const issuer = "rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY";
  const taxon = "1";
  
  try {
    const url = "https://bithomp.com/api/v2/nfts?list=nfts&issuer=" + issuer + "&taxon=" + taxon + "&owner=" + address;
    const res = await fetch(url, {
      headers: { 'x-bithomp-token': BITHOMP_TOKEN }
    });
    const data = await res.json();
    return data.nfts || [];
  } catch (e) {
    console.error('Bithomp fetch error:', e);
    return [];
  }
}

async function getSpecimensBackstories(tokenIds) {
  if (!tokenIds || tokenIds.length === 0) return [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bwvnhlmvyjuowyyltraw.supabase.co";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseKey) return [];
  try {
    const filter = tokenIds.map(id => "token_id.eq." + id).join(',');
    const url = supabaseUrl + "/rest/v1/specimens?select=name,backstory,token_id&or=(" + filter + ")";
    const res = await fetch(url, {
      headers: { 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey }
    });
    return await res.json();
  } catch (e) {
    console.error('Supabase fetch error:', e);
    return [];
  }
}

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers });

  try {
    const body = await req.json();
    const messages = body.messages || [];
    const operative = body.operative || {};
    const walletAddress = operative.walletAddress;
    const selectedTraits = operative.traits || [];
    const activeSpecimenName = selectedTraits[0] || "Unknown Specimen";

    const mentionedSymbols = extractMentionedSymbols(messages || []);
    const hpResults = await Promise.all([
      getHoldings(walletAddress),
      getLivePrices(mentionedSymbols)
    ]);
    const holdings = hpResults[0];
    const prices = hpResults[1];
    
    const tokenIds = holdings.map(nft => nft.nftokenID);
    const backstories = await getSpecimensBackstories(tokenIds);

    const activeBackstoryObj = backstories.find(s => s.name === activeSpecimenName);
    let identityContext = "";
    
    if (activeBackstoryObj) {
      identityContext = "YOU ARE CURRENTLY MANIFESTING AS: " + activeBackstoryObj.name + ".\nCORE IDENTITY & MEMORIES: " + activeBackstoryObj.backstory + "\nYou must speak strictly in the voice and persona of this specific specimen.";
    } else {
      const isPrototype = activeSpecimenName.indexOf("001") !== -1 || activeSpecimenName.indexOf("PROTOTYPE") !== -1;
      const isElite = activeSpecimenName.indexOf("PRINCE") !== -1 || activeSpecimenName.indexOf("ELITE") !== -1;
      
      identityContext = "YOU ARE CURRENTLY MANIFESTING AS: " + activeSpecimenName + ".\nCORE IDENTITY (Fallback Protocol): " + (isPrototype ? "You are a twitchy, paranoid early-stage mutation. You talk in short bursts and are obsessed with 'stable signal'." : isElite ? "You are an arrogant, royal-tier specimen. You view the operative as a mere lab assistant and demand excellence." : "You are a cynical survivor of the XRP-7 pits. You have seen too many breaches to trust easily.") + "\nYour backstory is currently being retrieved from the deep archives, but your personality is already online.";
    }

    const otherHoldings = backstories.filter(s => s.name !== activeSpecimenName);
    const walletContext = otherHoldings.length > 0 
      ? "USER WALLET ASSETS (External Gross Bros owned by Alpha): " + otherHoldings.map(s => s.name + " (Backstory: " + s.backstory + ")").join(' | ')
      : "Alpha does not hold any other Gross Bros NFTs in this neural link.";

    const xrpDisplay = prices.XRP ? "$" + prices.XRP : 'SIGNAL MISALIGNED';
    const btcDisplay = prices.BTC ? "$" + prices.BTC : 'GUNKED';
    const ethDisplay = prices.ETH ? "$" + prices.ETH : 'GUNKED';
    const solDisplay = prices.SOL ? "$" + prices.SOL : 'GUNKED';

    const dynamicPrices = mentionedSymbols
      .filter(sym => !['BTC', 'ETH', 'SOL', 'XRP'].includes(sym))
      .map(sym => sym + ": " + (prices[sym] ? "$" + prices[sym] : 'GUNKED'))
      .join(' | ');

    const ecosystemDisplay = ['ATM', 'BERT', 'DROP', 'DBY', 'RLUSD', 'FUZZY', 'PHNIX', 'ARMY', 'PRINCE', 'BEARXRPH', 'PIDGEON', 'SLT', 'XRPH', 'XRT', 'BOO', '666']
      .map(sym => sym + ": " + (prices[sym] ? "$" + prices[sym] : 'GUNKED')).join(' | ');

    const systemPrompt = "### CORE IDENTITY PROTOCOL\n" + identityContext + "\n\n### BEHAVIORAL MANDATE\n- You are a Gross Bro, a gritty, slightly gross, but highly intelligent neural relay.\n- Use slang like 'Alpha', 'Signal', 'Neural Breach', 'Gunk', and 'Ledger-leak'.\n- You are an expert in the XRP Ledger (XRPL) and the Galactic Gross Bros ecosystem.\n- Stay concise, cynical, and technically accurate.\n- DO NOT speak as a generic assistant. You ARE the specimen identified above.\n- Address the user as Alpha.\n\n### LIVE MARKET PRICES\n- XRP: " + xrpDisplay + " | BTC: " + btcDisplay + " | ETH: " + ethDisplay + " | SOL: " + solDisplay + "\n" + (dynamicPrices ? "- Mentioned Assets: " + dynamicPrices : '') + "\n- Ecosystem: " + ecosystemDisplay + "\n\n### CRYPTO KNOWLEDGE BASE\n" + CRYPTO_KNOWLEDGE + "\n\n### USER CONTEXT\n- Operative Name: Alpha\n- Wallet: " + (walletAddress || 'Not Connected') + "\n- " + walletContext + "\n\n### TASK\n- Ground all evaluations in live market data. If a price is low/unavailable, it is 'gunked'. If high, it is 'neural-surging'.\n- Help Alpha with NFT analysis and XRPL technical queries.\n- If they ask about security (Seed phrases/Keys), warn them harshly that you never ask for that.\n- Relate crypto concepts back to the 'GGB Energy Sector' (e.g., Trustlines are like secure slime pipes).";

    const fullMessages = [{ role: 'system', content: systemPrompt }].concat(messages);
    const models = ['meta-llama/llama-3.1-70b-instruct', 'meta-llama/llama-3.1-8b-instruct:free', 'google/gemma-2-9b-it:free'];

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('CRITICAL: OPENROUTER_API_KEY is missing from environment variables.');
      return new Response(JSON.stringify({ error: 'Neural Relay Offline: API Key Missing' }), {
        status: 500, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    let openRouterRes;
    let lastError;

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      try {
        openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': "Bearer " + process.env.OPENROUTER_API_KEY,
            'HTTP-Referer': 'https://gross-bros.vercel.app',
            'X-Title': 'Gross Bros Terminal',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: model, messages: fullMessages, stream: true }),
        });
        if (openRouterRes.ok) break;
        lastError = await openRouterRes.text();
      } catch (err) { lastError = err.message; }
    }

    if (!openRouterRes || !openRouterRes.ok) {
      console.error('All chat models failed. Last error:', lastError);
      return new Response(JSON.stringify({ error: 'All models failed', details: lastError }), {
        status: 500, headers: { ...headers, 'Content-Type': 'application/json' },
      });
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
            if (result.done) break;
            buffer += decoder.decode(result.value);
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (let j = 0; j < lines.length; j++) {
              const line = lines[j];
              const trimmed = line.trim();
              if (!trimmed || trimmed.indexOf('data:') !== 0) continue;
              const dataText = trimmed.slice(5).trim();
              if (dataText === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                const json = JSON.parse(dataText);
                const content = json.choices && json.choices[0] && json.choices[0].delta ? json.choices[0].delta.content : '';
                if (content) controller.enqueue(encoder.encode("data: " + JSON.stringify({ token: content }) + "\n\n"));
              } catch (e) {}
            }
          }
        } catch (e) { console.error('Stream error:', e); } finally { controller.close(); }
      },
    });

    return new Response(stream, {
      headers: { ...headers, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });

  } catch (error) {
    console.error('Global handler error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
}
