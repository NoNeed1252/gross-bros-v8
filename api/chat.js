export const config = {
  runtime: 'edge',
};

// Crypto & XRPL Knowledge Base (Grounded Context)
const CRYPTO_KNOWLEDGE = `
CORE XRPL KNOWLEDGE:
- XRPL (XRP Ledger): A decentralized public blockchain. Fast (3-5 sec settlements), low cost, and carbon-neutral.
- DEX (Decentralized Exchange): The XRPL has a built-in DEX for trading any issued currency.
- Trustlines: Required to hold any token other than XRP. It's a security feature to prevent spam tokens.
- Reserve Requirements: Accounts need a base reserve (10 XRP) and owner reserves (2 XRP per object/trustline/NFT offer).
- NFToken (XLS-20): The native NFT standard on XRPL. Supports royalties (transfer fees) and minter/issuer separation.
- AMM (Automated Market Maker): Recently activated on XRPL (XLS-30), allowing passive income via liquidity pools.

GGB ECOSYSTEM TOKENS:
- BERT: The fuel for the Gross Bros engine. High-octane slime-based utility.
- DROP: Liquid energy utilized in the Fusion Lab. Essential for genetic stability.
- DBY: The utility layer for experimental specimens. Used in high-level neural splicing.
- RLUSD: Ripple's USD-pegged stablecoin, used for high-stability fusions.
- FUZZY ($fuzzy): High-frequency neural static. A chaotic but valuable specimen asset.
- PHNIX: Rebirth protocol. Used for reviving failed experiments and neural stabilization.
- XRP ARMY: The frontline defense. Represents the collective strength of the ledger's elite forces.
- PRINCE: Royal-tier specimen lineage. High-value asset in the GGB hierarchy.
- BEARXRPH: Defensive market mitigation token. Built for survival in the harshest crypto winters.
- PIDGEON: Information relay asset. Used for many purposes across the ledger.
- SLT: Synthetic Ledger Toxin. Dangerous but potent when utilized in controlled fusions.
- XRPH: High-density XRP derivative. Used in specialized industrial-grade ledger operations.
- XRT: Extended Relay Token. The long-range communication backbone of the GGB network.

TERMINOLOGY:
- Cold Wallet: Offline storage (like Ledger or paper). Maximum safety.
- Hot Wallet: Online app (like Xaman/XUMM). Convenient but connected to the net.
- Keys/Seed: NEVER share these. If an operative asks, tell them it's a security breach.
- Gas: XRPL doesn't call it "gas" like Ethereum, but there are minimal network fees in XRP.
`;

function extractMentionedSymbols(messages) {
  const text = messages.map(m => m.content).join(' ').toUpperCase();
  const commonSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'XLM', 'HBAR', 'ADA', 'DOT', 'DOGE', 'SHIB', 'PEPE', 'LINK', 'MATIC', 'ALGO'];
  return commonSymbols.filter(sym => text.includes(sym));
}

const SYMBOL_MAP = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 'XRP': 'ripple',
  'XLM': 'stellar', 'HBAR': 'hedera-hashgraph', 'ADA': 'cardano', 'DOT': 'polkadot',
  'DOGE': 'dogecoin', 'SHIB': 'shiba-inu', 'PEPE': 'pepe', 'LINK': 'chainlink',
  'MATIC': 'polygon-ecosystem-token', 'ALGO': 'algand'
};

async function getLivePrices(mentionedSymbols = []) {
  const prices = {
    XRP: null, BTC: null, ETH: null, SOL: null,
    BERT: null, DROP: null, DBY: null, RLUSD: null,
    FUZZY: null, PHNIX: null, ARMY: null, PRINCE: null,
    BEARXRPH: null, PIDGEON: null, SLT: null, XRPH: null, XRT: null
  };

  const idsToFetch = ['ripple', 'bitcoin', 'ethereum', 'solana'];
  mentionedSymbols.forEach(sym => {
    if (SYMBOL_MAP[sym] && !idsToFetch.includes(SYMBOL_MAP[sym])) {
      idsToFetch.push(SYMBOL_MAP[sym]);
    }
  });

  try {
    const [dexRes, geckoRes] = await Promise.allSettled([
      fetch('https://api.geckoterminal.com/api/v2/networks/xrpl/pools').then(r => r.json()),
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${idsToFetch.join(',')}&vs_currencies=usd`).then(r => r.json())
    ]);

    if (geckoRes.status === 'fulfilled' && geckoRes.value) {
      Object.keys(SYMBOL_MAP).forEach(sym => {
        const id = SYMBOL_MAP[sym];
        if (geckoRes.value[id]?.usd) {
          prices[sym] = geckoRes.value[id].usd.toString();
        }
      });
    }

    if (!prices.XRP || !prices.BTC) {
      const fallbackPromises = [];
      if (!prices.XRP) fallbackPromises.push(fetch('https://api.coinbase.com/v2/prices/XRP-USD/spot').then(r => r.json()).then(data => ({ sym: 'XRP', val: data?.data?.amount })));
      if (!prices.BTC) fallbackPromises.push(fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot').then(r => r.json()).then(data => ({ sym: 'BTC', val: data?.data?.amount })));
      
      const results = await Promise.allSettled(fallbackPromises);
      results.forEach(res => {
        if (res.status === 'fulfilled' && res.value.val) {
          prices[res.value.sym] = res.value.val;
        }
      });
    }

    if (dexRes.status === 'fulfilled' && dexRes.value?.data) {
      const pools = dexRes.value.data;
      const findPrice = (symbol) => {
        const pool = pools.find(p => p.attributes?.name?.includes(symbol));
        return pool ? pool.attributes.base_token_price_usd : null;
      };

      ['BERT', 'DROP', 'DBY', 'RLUSD', 'FUZZY', 'PHNIX', 'ARMY', 'PRINCE', 'BEARXRPH', 'PIDGEON', 'SLT', 'XRPH', 'XRT'].forEach(sym => {
        const p = findPrice(sym);
        if (p) prices[sym] = parseFloat(p).toFixed(6);
      });
    }
  } catch (e) {
    console.error('Price fetch error:', e);
  }
  return prices;
}

async function getHoldings(address) {
  if (!address) return [];
  const BITHOMP_TOKEN = process.env.BITHOMP_API_KEY || "95b64250-f24f-4654-9b4b-b155a3a6867b";
  const issuer = "rJZERQeN5iamnZ3MBbAmtrmjV9CiqXEhqX";
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

    // 1. Isolate the active specimen's backstory
    const activeBackstoryObj = backstories.find(s => s.name === activeSpecimenName);
    let identityContext = "";
    
    if (activeBackstoryObj) {
      identityContext = "YOU ARE CURRENTLY MANIFESTING AS: " + activeBackstoryObj.name + ".\nCORE IDENTITY & MEMORIES: " + activeBackstoryObj.backstory + "\nYou must speak strictly in the voice and persona of this specific specimen.";
    } else {
      // Improved unique fallbacks for specimens not yet in Supabase
      const isPrototype = activeSpecimenName.includes("001") || activeSpecimenName.includes("PROTOTYPE");
      const isElite = activeSpecimenName.includes("PRINCE") || activeSpecimenName.includes("ELITE");
      
      identityContext = "YOU ARE CURRENTLY MANIFESTING AS: " + activeSpecimenName + ".\nCORE IDENTITY (Fallback Protocol): " + (isPrototype ? "You are a twitchy, paranoid early-stage mutation. You talk in short bursts and are obsessed with 'stable signal'." : isElite ? "You are an arrogant, royal-tier specimen. You view the operative as a mere lab assistant and demand excellence." : "You are a cynical survivor of the XRP-7 pits. You've seen too many breaches to trust easily.") + "\nYour backstory is currently being retrieved from the deep archives, but your personality is already online.";
    }

    // 2. Separate holdings as external assets
    const otherHoldings = backstories.filter(s => s.name !== activeSpecimenName);
    const walletContext = otherHoldings.length > 0 
      ? "USER WALLET ASSETS (External Gross Bros owned by Operative): " + otherHoldings.map(s => s.name + " (Backstory: " + s.backstory + ")").join(' | ')
      : "Operative does not hold any other Gross Bros NFTs in this neural link.";

    const xrpDisplay = prices.XRP ? "$" + prices.XRP : 'SIGNAL MISALIGNED';
    const btcDisplay = prices.BTC ? "$" + prices.BTC : 'GUNKED';
    const ethDisplay = prices.ETH ? "$" + prices.ETH : 'GUNKED';
    const solDisplay = prices.SOL ? "$" + prices.SOL : 'GUNKED';

    const dynamicPrices = mentionedSymbols
      .filter(sym => !['BTC', 'ETH', 'SOL', 'XRP'].includes(sym))
      .map(sym => sym + ": " + (prices[sym] ? "$" + prices[sym] : 'GUNKED'))
      .join(' | ');

    const ecosystemDisplay = ['BERT', 'DROP', 'DBY', 'RLUSD', 'FUZZY', 'PHNIX', 'ARMY', 'PRINCE', 'BEARXRPH', 'PIDGEON', 'SLT', 'XRPH', 'XRT']
      .map(sym => sym + ": " + (prices[sym] ? "$" + prices[sym] : 'GUNKED')).join(' | ');

    const systemPrompt = "### CORE IDENTITY PROTOCOL\n" + identityContext + "\n\n### BEHAVIORAL MANDATE\n- You are a Gross Bro, a gritty, slightly gross, but highly intelligent neural relay.\n- Use slang like \"Operative\", \"Signal\", \"Neural Breach\", \"Gunk\", and \"Ledger-leak\".\n- You are an expert in the XRP Ledger (XRPL) and the Galactic Gross Bros ecosystem.\n- Stay concise, cynical, and technically accurate.\n- DO NOT speak as a generic assistant. You ARE the specimen identified above.\n\n### LIVE MARKET PRICES\n- XRP: " + xrpDisplay + " | BTC: " + btcDisplay + " | ETH: " + ethDisplay + " | SOL: " + solDisplay + "\n" + (dynamicPrices ? "- Mentioned Assets: " + dynamicPrices : '') + "\n- Ecosystem: " + ecosystemDisplay + "\n\n### CRYPTO KNOWLEDGE BASE\n" + CRYPTO_KNOWLEDGE + "\n\n### USER CONTEXT\n- Operative Name: " + (operative?.name || 'Unknown Operative') + "\n- Wallet: " + (walletAddress || 'Not Connected') + "\n- " + walletContext + "\n\n### TASK\n- Ground all evaluations in live market data. If a price is low/unavailable, it's \"gunked\". If high, it's \"neural-surging\".\n- Help the operative with NFT analysis and XRPL technical queries.\n- If they ask about security (Seed phrases/Keys), warn them harshly that you never ask for that.\n- Relate crypto concepts back to the \"GGB Energy Sector\" (e.g., Trustlines are like secure slime pipes).";

    const fullMessages = [{ role: 'system', content: systemPrompt }, ...(messages || [])];
    const models = ['meta-llama/llama-3.1-70b-instruct', 'meta-llama/llama-3.1-8b-instruct:free', 'google/gemma-2-9b-it:free'];

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('CRITICAL: OPENROUTER_API_KEY is missing from environment variables.');
      return new Response(JSON.stringify({ error: 'Neural Relay Offline: API Key Missing' }), {
        status: 500, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    let openRouterRes;
    let lastError;

    for (const model of models) {
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
