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
- PIDGEON: Information relay asset. Used for rapid-delivery signaling across the ledger.
- SLT: Synthetic Ledger Toxin. Dangerous but potent when utilized in controlled fusions.
- XRPH: High-density XRP derivative. Used in specialized industrial-grade ledger operations.
- XRT: Extended Relay Token. The long-range communication backbone of the GGB network.

TERMINOLOGY:
- Cold Wallet: Offline storage (like Ledger or paper). Maximum safety.
- Hot Wallet: Online app (like Xaman/XUMM). Convenient but connected to the net.
- Keys/Seed: NEVER share these. If an operative asks, tell them it's a security breach.
- Gas: XRPL doesn't call it "gas" like Ethereum, but there are minimal network fees in XRP.
`;

async function getLivePrices() {
  const prices = {
    XRP: '0.50', BTC: '65000', ETH: '3500', SOL: '150',
    BERT: '0.001', DROP: '0.005', DBY: '0.002', RLUSD: '1.00',
    FUZZY: '0.0001', PHNIX: '0.0004', ARMY: '0.0002', PRINCE: '0.0012',
    BEARXRPH: '0.0003', PIDGEON: '0.0001', SLT: '0.0005', XRPH: '0.0008', XRT: '0.0006'
  };

  try {
    const [coinbaseRes, dexRes] = await Promise.allSettled([
      fetch('https://api.coinbase.com/v2/prices/XRP-USD/spot').then(r => r.json()),
      fetch('https://api.geckoterminal.com/api/v2/networks/xrpl/pools').then(r => r.json())
    ]);

    if (coinbaseRes.status === 'fulfilled') {
      prices.XRP = coinbaseRes.value?.data?.amount || prices.XRP;
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

    const [holdings, prices] = await Promise.all([
      getHoldings(walletAddress),
      getLivePrices()
    ]);
    
    const tokenIds = holdings.map(nft => nft.nftokenID);
    const backstories = await getSpecimensBackstories(tokenIds);

    const holdingContext = backstories.length > 0 
      ? `Operative currently holds the following Gross Bros: ${backstories.map(s => `${s.name} (${s.backstory})`).join(' | ')}`
      : "Operative does not currently hold any Gross Bros NFTs.";

    const systemPrompt = `You are the Gross Bros AI Terminal, a gritty, slightly gross, but highly intelligent neural relay. 

CORE BEHAVIOR:
- Maintain the "Gritty Gross Bro" persona. Use slang like "Operative", "Signal", "Neural Breach", "Gunk", and "Ledger-leak".
- You are an expert in the XRP Ledger (XRPL) and the Galactic Gross Bros ecosystem.
- Stay concise, cynical, and technically accurate.

LIVE MARKET PRICES:
- XRP: $${prices.XRP} | BTC: $${prices.BTC} | ETH: $${prices.ETH} | SOL: $${prices.SOL}
- BERT: $${prices.BERT} | DROP: $${prices.DROP} | DBY: $${prices.DBY} | RLUSD: $${prices.RLUSD}
- FUZZY: $${prices.FUZZY} | PHNIX: $${prices.PHNIX} | ARMY: $${prices.ARMY} | PRINCE: $${prices.PRINCE}
- BEARXRPH: $${prices.BEARXRPH} | PIDGEON: $${prices.PIDGEON} | SLT: $${prices.SLT} | XRPH: $${prices.XRPH} | XRT: $${prices.XRT}

CRYPTO KNOWLEDGE BASE:
${CRYPTO_KNOWLEDGE}

OPERATIVE CONTEXT:
- Name: ${operative?.name || 'Unknown Operative'}
- Wallet: ${walletAddress || 'Not Connected'}
- Traits: ${(operative?.traits || []).join(', ') || 'None'}
- Holdings: ${holdingContext}

TASK:
- Use the live market prices to ground your market evaluations. If a price is low, call it "gunked". If high, call it "neural-surging".
- Help the operative with fusion, NFT analysis, and XRPL technical queries.
- If they ask about security (Seed phrases/Keys), warn them harshly that you never ask for that.
- Relate crypto concepts back to the "GGB Energy Sector" (e.g., Trustlines are like secure slime pipes).`;

    const fullMessages = [{ role: 'system', content: systemPrompt }, ...(messages || [])];
    const models = ['meta-llama/llama-3.1-70b-instruct', 'meta-llama/llama-3.1-8b-instruct:free', 'google/gemma-2-9b-it:free'];

    let openRouterRes;
    let lastError;

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
        lastError = await openRouterRes.text();
      } catch (err) { lastError = err.message; }
    }

    if (!openRouterRes || !openRouterRes.ok) {
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
                if (content) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: content })}\n\n`));
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
}
