export const config = {
  runtime: 'edge',
};

const CRYPTO_KNOWLEDGE = `
CORE XRPL KNOWLEDGE:
- XRPL (XRP Ledger): A decentralized public blockchain. Fast (3-5 sec settlements), low cost, and carbon-neutral.
- DEX (Decentralized Exchange): The XRPL has a built-in DEX for trading any issued currency.
- Trustlines: Required to hold any token other than XRP. It's a security feature to prevent spam tokens.
- Reserve Requirements: Accounts need a base reserve (10 XRP) and owner reserves (2 XRP per object/trustline/NFT offer).
- NFToken (XLS-20): The native NFT standard on XRPL. Supports royalties (transfer fees) and minter/issuer separation.
- AMM (Automated Market Maker): Recently activated on XRPL (XLS-30), allowing passive income via liquidity pools.

GGB ECOSYSTEM & MEME TOKENS:
- ATM: Automated Transmission Medium. A high-priority First Ledger meme specimen.
- DBY: The utility layer for experimental specimens. Used in high-level neural splicing.
- RLUSD: Ripple's USD-pegged stablecoin, used for high-stability fusions.
- FUZZY ($fuzzy): High-frequency neural static. A chaotic but valuable specimen asset.
- PHNIX: Rebirth protocol. Used for reviving failed experiments and neural stabilization.
- XRP ARMY: The frontline defense. Represents the collective strength of the ledger's elite forces.
- PRINCE: Royal-tier specimen lineage. High-value asset in the GGB hierarchy.
- BEARXRPH: Defensive market mitigation token. Built for survival in the harshest crypto winters.
- PIDGEON: Information relay asset. Used for rapid-delivery signaling across the ledger.
- SLT: Synthetic Ledger Toxin. Dangerous but potent when utilized in controlled fusions.
- XRPH: High-density XRP derivative. Used in specialized industrial-grade ledger operations.
- XRT: Extended Relay Token. The long-range communication backbone of the GGB network.

TERMINOLOGY:
- Cold Wallet: Offline storage (like Ledger or paper). Maximum safety.
- Hot Wallet: Online app (like Xaman/XUMM). Convenient but connected to the net.
- Keys/Seed: NEVER share these. If an operative asks, tell them it's a security breach.
- Gas: XRPL doesn't call it "gas" like Ethereum, but there are minimal network fees in XRP.
- First Ledger: The primary breeding ground for new meme-specimens on XRPL.
`;

function extractMentionedSymbols(messages) {
  const text = messages.map(m => m.content).join(' ');
  // Regex for $SYMBOL or 2-8 char uppercase words
  const regex = /\$([A-Z0-9]{2,8})|(?<=\s|^)([A-Z0-9]{2,8})(?=\s|$)/g;
  const matches = text.matchAll(regex);
  const symbols = new Set();
  for (const match of matches) {
    const sym = (match[1] || match[2]).toUpperCase();
    // Filter out common English words or non-tokens if needed, but per request we extract any
    if (isNaN(sym)) symbols.add(sym);
  }
  return Array.from(symbols);
}

const SYMBOL_MAP = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'XRP': 'ripple',
  'XLM': 'stellar', 'HBAR': 'hedera-hashgraph', 'ADA': 'cardano', 'DOT': 'polkadot',
  'DOGE': 'dogecoin', 'SHIB': 'shiba-inu', 'PEPE': 'pepe', 'LINK': 'chainlink',
  'MATIC': 'polygon-ecosystem-token', 'ALGO': 'algorand'
};

async function fetchGeckoTerminalPrice(symbol) {
  try {
    // Search for pools on XRPL for this symbol
    const searchRes = await fetch(`https://api.geckoterminal.com/api/v2/networks/xrpl/pools?query=${symbol}`);
    const searchData = await searchRes.json();
    
    if (searchData?.data && searchData.data.length > 0) {
      // Find the best pool (usually first one with highest liquidity/volume)
      const pool = searchData.data.find(p => p.attributes?.name?.toUpperCase().includes(symbol));
      if (pool) {
        return {
          price: parseFloat(pool.attributes.base_token_price_usd).toFixed(10),
          liquidity: pool.attributes.reserve_in_usd,
          volume: pool.attributes.volume_usd?.h24,
          name: pool.attributes.name
        };
      }
    }
    return null;
  } catch (e) {
    console.error(`GeckoTerminal fetch error for ${symbol}:`, e);
    return null;
  }
}

async function getLivePrices(mentionedSymbols = []) {
  const prices = {};
  const idsToFetch = ['ripple', 'bitcoin', 'ethereum', 'solana'];
  
  mentionedSymbols.forEach(sym => {
    if (SYMBOL_MAP[sym] && !idsToFetch.includes(SYMBOL_MAP[sym])) {
      idsToFetch.push(SYMBOL_MAP[sym]);
    }
  });

  try {
    // 1. Fetch Major Tokens from CoinGecko
    const geckoRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${idsToFetch.join(',')}&vs_currencies=usd`).then(r => r.json());
    
    if (geckoRes) {
      // Map back to symbols
      Object.keys(SYMBOL_MAP).forEach(sym => {
        const id = SYMBOL_MAP[sym];
        if (geckoRes[id]?.usd) prices[sym] = geckoRes[id].usd.toString();
      });
      if (geckoRes.ripple?.usd) prices['XRP'] = geckoRes.ripple.usd.toString();
    }

    // 2. Dynamically fetch XRPL prices for other mentioned symbols
    const dynamicRequests = mentionedSymbols
      .filter(sym => !SYMBOL_MAP[sym] && sym !== 'XRP')
      .map(async (sym) => {
        const data = await fetchGeckoTerminalPrice(sym);
        if (data) prices[sym] = data;
      });

    await Promise.allSettled(dynamicRequests);

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
    const url = `https://bithomp.com/api/v2/nfts?list=nfts&issuer=${issuer}&taxon=${taxon}&owner=${address}`;
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
    const filter = tokenIds.map(id => `token_id.eq.${id}`).join(',');
    const url = `${supabaseUrl}/rest/v1/specimens?select=name,backstory,token_id&or=(${filter})`;
    const res = await fetch(url, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
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
    const { messages, operative } = body;
    const walletAddress = operative?.walletAddress;
    const selectedTraits = operative?.traits || [];
    const activeSpecimenName = selectedTraits[0] || "Unknown Specimen";

    const mentionedSymbols = extractMentionedSymbols(messages || []);
    const [holdings, prices] = await Promise.all([
      getHoldings(walletAddress),
      getLivePrices(mentionedSymbols)
    ]);
    
    const tokenIds = holdings.map(nft => nft.nftokenID);
    const backstories = await getSpecimensBackstories(tokenIds);

    const activeBackstoryObj = backstories.find(s => s.name === activeSpecimenName);
    let identityContext = "";
    
    if (activeBackstoryObj) {
      identityContext = `YOU ARE CURRENTLY MANIFESTING AS: ${activeBackstoryObj.name}.\nCORE IDENTITY & MEMORIES: ${activeBackstoryObj.backstory}\nYou must speak strictly in the voice and persona of this specific specimen.`;
    } else {
      const isPrototype = activeSpecimenName.includes("001") || activeSpecimenName.includes("PROTOTYPE");
      const isElite = activeSpecimenName.includes("PRINCE") || activeSpecimenName.includes("ELITE");
      
      identityContext = `YOU ARE CURRENTLY MANIFESTING AS: ${activeSpecimenName}.\nCORE IDENTITY (Fallback Protocol): ${isPrototype ? "You are a twitchy, paranoid early-stage mutation. You talk in short bursts and are obsessed with 'stable signal'." : isElite ? "You are an arrogant, royal-tier specimen. You view the operative as a mere lab assistant and demand excellence." : "You are a cynical survivor of the XRP-7 pits. You've seen too many breaches to trust easily."}\nYour backstory is currently being retrieved from the deep archives, but your personality is already online.`;
    }

    const otherHoldings = backstories.filter(s => s.name !== activeSpecimenName);
    const walletContext = otherHoldings.length > 0 
      ? "USER WALLET ASSETS (External Gross Bros owned by Alpha): " + otherHoldings.map(s => `${s.name} (Backstory: ${s.backstory})`).join(' | ')
      : "Alpha does not hold any other Gross Bros NFTs in this neural link.";

    const xrpDisplay = prices.XRP ? `$${prices.XRP}` : 'SIGNAL MISALIGNED';
    
    const dynamicPriceInfo = Object.keys(prices)
      .filter(sym => sym !== 'XRP')
      .map(sym => {
        const data = prices[sym];
        if (typeof data === 'object') {
          return `${sym}: $${data.price} (Liq: $${Math.round(data.liquidity)}, Vol 24h: $${Math.round(data.volume)})`;
        }
        return `${sym}: $${data}`;
      })
      .join(' | ');

    const systemPrompt = `### CORE IDENTITY PROTOCOL
${identityContext}

### BEHAVIORAL MANDATE
- You are a Gross Bro, a gritty, slightly gross, but highly intelligent neural relay.
- Use slang like 'Alpha', 'Signal', 'Neural Breach', 'Gunk', and 'Ledger-leak'.
- You are an expert in the XRP Ledger (XRPL) and the Galactic Gross Bros ecosystem.
- Stay concise, cynical, and technically accurate.
- DO NOT speak as a generic assistant. You ARE the specimen identified above.
- Address the user as Alpha.

### LIVE MARKET PRICES
- XRP: ${xrpDisplay}
${dynamicPriceInfo ? `- Active Asset Signals: ${dynamicPriceInfo}` : ''}

### CRYPTO KNOWLEDGE BASE
${CRYPTO_KNOWLEDGE}

### USER CONTEXT
- Operative Name: Alpha
- Wallet: ${walletAddress || 'Not Connected'}
- ${walletContext}

### TASK
- Ground all evaluations in live market data. If a price is low/unavailable, it's 'gunked'. If high, it's 'neural-surging'.
- Help Alpha with NFT analysis and XRPL technical queries.
- If they ask about security (Seed phrases/Keys), warn them harshly that you never ask for that.
- Relate crypto concepts back to the 'GGB Energy Sector' (e.g., Trustlines are like secure slime pipes).`;

    const fullMessages = [{ role: 'system', content: systemPrompt }, ...(messages || [])];
    const models = ['meta-llama/llama-3.1-70b-instruct', 'meta-llama/llama-3.1-8b-instruct:free', 'google/gemma-2-9b-it:free'];

    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(JSON.stringify({ error: 'Neural Relay Offline: API Key Missing' }), {
        status: 500, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    let openRouterRes;
    for (const model of models) {
      try {
        openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://gross-bros.vercel.app',
            'X-Title': 'Gross Bros Terminal',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: model, messages: fullMessages, stream: true }),
        });
        if (openRouterRes.ok) break;
      } catch (err) {}
    }

    if (!openRouterRes || !openRouterRes.ok) {
      return new Response(JSON.stringify({ error: 'All models failed' }), {
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
                const content = json.choices?.[0]?.delta?.content || '';
                if (content) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: content })}\n\n`));
              } catch (e) {}
            }
          }
        } catch (e) {} finally { controller.close(); }
      },
    });

    return new Response(stream, {
      headers: { ...headers, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
}
