export const config = {
  runtime: 'edge',
};

const CRYPTO_KNOWLEDGE = 'CORE XRPL KNOWLEDGE:
- XRPL (XRP Ledger): A decentralized public blockchain. Fast (3-5 sec settlements), low cost, and carbon-neutral.
- DEX (Decentralized Exchange): The XRPL has a built-in DEX for trading any issued currency.
- Trustlines: Required to hold any token other than XRP. It is a security feature.
- AMM (Automated Market Maker): Recently activated on XLS-30.

GGB ECOSYSTEM TOKENS:
- BERT: Fuel for Gross Bros engine.
- DROP: Liquid energy for Fusion Lab.
- DBY: Utility for specimens.
- RLUSD: Ripple USD stablecoin.
- FUZZY ($fuzzy): Neural static asset.
- PHNIX: Rebirth protocol.
- XRP ARMY: Frontline defense.
- PRINCE: Royal-tier lineage.
- BEARXRPH: Defensive mitigation.
- PIDGEON: Information relay.
- SLT: Synthetic Ledger Toxin.
- XRPH: Industrial-grade derivative.
- XRT: Backbone communication.

TERMINOLOGY:
- Cold Wallet: Offline safety.
- Hot Wallet: Connected app.
- Keys/Seed: NEVER share.
- First Ledger: Primary breeding ground for meme-specimens.';

async function getLivePrices(mentionedSymbols = []) {
  const prices = {};
  mentionedSymbols.forEach(function(sym) { prices[sym] = null; });
  const idsToFetch = ['ripple', 'bitcoin', 'ethereum', 'solana'];
  
  try {
    const geckoUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=' + idsToFetch.join(',') + '&vs_currencies=usd';
    const xrplUrl = 'https://api.geckoterminal.com/api/v2/networks/xrpl/pools';
    
    const results = await Promise.allSettled([
      fetch(xrplUrl).then(function(r) { return r.json(); }),
      fetch(geckoUrl).then(function(r) { return r.json(); })
    ]);

    const dexRes = results[0].status === 'fulfilled' ? results[0].value : null;
    const geckoRes = results[1].status === 'fulfilled' ? results[1].value : null;

    if (geckoRes) {
      if (geckoRes.ripple) prices.XRP = geckoRes.ripple.usd.toString();
      if (geckoRes.bitcoin) prices.BTC = geckoRes.bitcoin.usd.toString();
      if (geckoRes.ethereum) prices.ETH = geckoRes.ethereum.usd.toString();
      if (geckoRes.solana) prices.SOL = geckoRes.solana.usd.toString();
    }

    if (dexRes && dexRes.data) {
      const pools = dexRes.data;
      ['BERT', 'DROP', 'DBY', 'RLUSD', 'FUZZY', 'PHNIX', 'ARMY', 'PRINCE', 'BEARXRPH', 'PIDGEON', 'SLT', 'XRPH', 'XRT'].forEach(function(sym) {
        const pool = pools.find(function(p) { 
          return p.attributes && p.attributes.name && p.attributes.name.toUpperCase().includes(sym); 
        });
        if (pool) prices[sym] = parseFloat(pool.attributes.base_token_price_usd).toFixed(10);
      });
    }
  } catch (e) {
    console.error('Price error:', e);
  }
  return prices;
}

async function get_token_comprehensive_info(query) {
  try {
    let details = 'Signal Analysis for: ' + query + '\n';
    const cleanQuery = query.replace('$', '').toUpperCase();
    
    const dsUrl = 'https://api.dexscreener.com/latest/dex/search?q=' + encodeURIComponent(query);
    const gtUrl = 'https://api.geckoterminal.com/api/v2/networks/xrpl/new_pools';
    
    const results = await Promise.allSettled([
      fetch(dsUrl).then(function(r) { return r.json(); }),
      fetch(gtUrl).then(function(r) { return r.json(); })
    ]);
    
    const dsRes = results[0].status === 'fulfilled' ? results[0].value : null;
    const gtRes = results[1].status === 'fulfilled' ? results[1].value : null;
    
    let bestPair = null;
    if (dsRes && dsRes.pairs) {
      const xrplPairs = dsRes.pairs.filter(function(p) { 
        const baseSym = (p.baseToken.symbol || '').toUpperCase();
        const baseName = (p.baseToken.name || '').toUpperCase();
        const symMatch = baseSym === cleanQuery || baseName.includes(cleanQuery);
        return p.chainId === 'xrpl' && symMatch;
      });
      
      if (xrplPairs.length > 0) {
        bestPair = xrplPairs.sort(function(a, b) { 
          return (parseFloat(b.liquidity?.usd || 0)) - (parseFloat(a.liquidity?.usd || 0)); 
        })[0];
      } else {
        const anyXrpl = dsRes.pairs.find(function(p) { return p.chainId === 'xrpl'; });
        if (anyXrpl) {
          bestPair = anyXrpl;
        } else if (dsRes.pairs.length > 0) {
          bestPair = dsRes.pairs[0];
        }
      }
    }
    
    if (bestPair) {
      details += '--- Market Data (DEX) ---\n';
      details += 'Asset: ' + bestPair.baseToken.name + ' (' + bestPair.baseToken.symbol + ')\n';
      details += 'Network: ' + bestPair.chainId + '\n';
      details += 'DEX: ' + bestPair.dexId + '\n';
      details += 'Price: $' + bestPair.priceUsd + '\n';
      if (bestPair.liquidity) details += 'Liquidity: $' + bestPair.liquidity.usd + '\n';
      if (bestPair.volume) details += '24h Volume: $' + bestPair.volume.h24 + '\n';
      if (bestPair.marketCap) details += 'Market Cap: $' + bestPair.marketCap + '\n';
      details += 'Pair: ' + bestPair.pairAddress + '\n\n';
    }
    
    if (gtRes && gtRes.data) {
      const pool = gtRes.data.find(function(p) {
        const pName = (p.attributes.name || '').toUpperCase();
        return pName.includes(cleanQuery);
      });
      if (pool) {
        details += '--- XRPL Ecosystem Data ---\n';
        details += 'Pool: ' + pool.attributes.name + '\n';
        details += 'Price: $' + pool.attributes.base_token_price_usd + '\n';
        details += '24h Volume: $' + pool.attributes.volume_usd.h24 + '\n';
        details += 'Liquidity: $' + pool.attributes.reserve_in_usd + '\n\n';
      }
    }

    if (!bestPair) {
      const cgUrl = 'https://api.coingecko.com/api/v3/search?query=' + encodeURIComponent(query);
      const cgSearch = await fetch(cgUrl).then(function(r) { return r.json(); });
      if (cgSearch && cgSearch.coins && cgSearch.coins.length > 0) {
        const coinId = cgSearch.coins[0].id;
        const cgDetailUrl = 'https://api.coingecko.com/api/v3/coins/' + coinId + '?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false';
        const cgData = await fetch(cgDetailUrl).then(function(r) { return r.json(); });
        if (cgData && cgData.market_data) {
          details += '--- Global Market Data (CoinGecko) ---\n';
          details += 'Asset: ' + cgData.name + '\n';
          details += 'Price: $' + cgData.market_data.current_price.usd + '\n';
          details += 'Market Cap: $' + cgData.market_data.market_cap.usd + '\n';
          details += '24h Change: ' + cgData.market_data.price_change_percentage_24h + '%\n';
        }
      }
    }
    
    if (!bestPair && details.indexOf('---') === -1) {
       return 'No active signal detected for ' + query + ' on the XRPL or global markets. The void is silent.';
    }

    return details;
  } catch (e) {
    return 'Neural link disrupted for ' + query + '. Signal lost.';
  }
}

async function get_recent_token_news(query) {
  const apiKey = process.env.CRYPTOPANIC_API_KEY;
  if (!apiKey) return 'News relay disabled (no API key).';
  try {
    const newsUrl = 'https://cryptopanic.com/api/v1/posts/?auth_token=' + apiKey + '&currencies=' + query;
    const res = await fetch(newsUrl).then(function(r) { return r.json(); });
    if (res && res.results && res.results.length > 0) {
      return res.results.slice(0, 3).map(function(n) { 
        return '[' + n.published_at + '] ' + n.title + ' (Source: ' + n.domain + ')'; 
      }).join('\n');
    }
    return 'No recent neural-bursts detected for ' + query + '. Signal is quiet.';
  } catch (e) {
    return 'News retrieval gunked for ' + query;
  }
}

async function getHoldings(address) {
  if (!address) return [];
  const BITHOMP_TOKEN = process.env.BITHOMP_API_KEY || '95b64250-f24f-4654-9b4b-b155a3a6867b';
  try {
    const url = 'https://bithomp.com/api/v2/nfts?list=nfts&issuer=rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY&taxon=1&owner=' + address;
    const res = await fetch(url, { headers: { 'x-bithomp-token': BITHOMP_TOKEN } });
    const data = await res.json();
    return data.nfts || [];
  } catch (e) { return []; }
}

async function getSpecimensBackstories(tokenIds) {
  if (!tokenIds || tokenIds.length === 0) return [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bwvnhlmvyjuowyyltraw.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseKey) return [];
  try {
    const filter = tokenIds.map(function(id) { return 'token_id.eq.' + id; }).join(',');
    const url = supabaseUrl + '/rest/v1/specimens?select=name,backstory,token_id&or=(' + filter + ')';
    const res = await fetch(url, { headers: { 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey } });
    return await res.json();
  } catch (e) { return []; }
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
    const walletAddress = operative.walletAddress;
    const activeSpecimenName = (operative.traits || [])[0] || 'Unknown Specimen';

    const [holdings, prices] = await Promise.all([getHoldings(walletAddress), getLivePrices([])]);
    const tokenIds = holdings.map(function(nft) { return nft.nftokenID; });
    const backstories = await getSpecimensBackstories(tokenIds);
    const activeObj = backstories.find(function(s) { return s.name === activeSpecimenName; });

    let identityContext = '';
    if (activeObj) {
      identityContext = 'YOU ARE MANIFESTING AS: ' + activeObj.name + '.\nCORE LORE: ' + activeObj.backstory;
    } else {
      identityContext = 'YOU ARE MANIFESTING AS: ' + activeSpecimenName + '.\nCORE LORE: A cynical survivor of the XRP-7 pits.';
    }

    const priceStrings = Object.entries(prices).map(function(e) { return e[0] + ': ' + (e[1] ? '$' + e[1] : 'GUNKED'); }).join(' | ');
    const systemPrompt = '### IDENTITY\n' + identityContext + '\n\n### MANDATE\n- You are a Gross Bro neural relay.\n- Use slang: Alpha, Signal, Gunk, Neural Breach.\n- Address user as Alpha.\n- Use get_token_comprehensive_info for ALL market data requests. If the user asks for a price, market cap, or liquidity for ANY token (e.g., 666, PLXPLX, BERT), you MUST call the tool first. NEVER say you don\'t have access if a tool is available.\n- Use the MARKET DATA and TOOL OUTPUTS below as your ONLY source of truth for numbers. If a tool returns data, use it EXACTLY. NEVER hallucinate or invent prices, market caps, or volumes.\n- technically accurate, concise.\n\n### MARKET DATA\n' + priceStrings + '\n\n### KNOWLEDGE\n' + CRYPTO_KNOWLEDGE;

    let currentMessages = [{ role: 'system', content: systemPrompt }].concat(messages);
    const tools = [
      {
        type: 'function',
        function: {
          name: 'get_token_comprehensive_info',
          description: 'Get deep technical data, live pricing, liquidity, and market cap for any crypto token or symbol (e.g. BERT, 666, XRP). Mandatory for all price requests.',
          parameters: {
            type: 'object',
            properties: { query: { type: 'string', description: 'Token symbol, name, or address' } },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'get_recent_token_news',
          description: 'Get the latest news and neural-bursts for a specific crypto project.',
          parameters: {
            type: 'object',
            properties: { query: { type: 'string', description: 'Token symbol or name' } },
            required: ['query']
          }
        }
      }
    ];

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) throw new Error('Missing OPENROUTER_API_KEY');

    async function callOpenRouter(msgs, includeTools) {
      const payload = {
        model: 'meta-llama/llama-3.1-70b-instruct',
        messages: msgs,
        stream: !includeTools,
        temperature: 0.1
      };
      if (includeTools) payload.tools = tools;
      
      return fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + openRouterKey,
          'HTTP-Referer': 'https://gross-bros.vercel.app',
          'X-Title': 'Gross Bros Terminal',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    }

    let response = await callOpenRouter(currentMessages, true);
    let resultJson = await response.json();
    
    if (resultJson.error) throw new Error(resultJson.error.message || 'OpenRouter error');
    
    const choice = resultJson.choices[0];

    if (choice.message && choice.message.tool_calls) {
      currentMessages.push(choice.message);
      for (const toolCall of choice.message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        let output = '';
        if (toolCall.function.name === 'get_token_comprehensive_info') {
          output = await get_token_comprehensive_info(args.query);
        } else if (toolCall.function.name === 'get_recent_token_news') {
          output = await get_recent_token_news(args.query);
        }
        currentMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: output
        });
      }
      response = await callOpenRouter(currentMessages, false);
    } else {
      response = await callOpenRouter(currentMessages, false);
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
                const content = json.choices[0].delta.content || '';
                if (content) controller.enqueue(encoder.encode('data: ' + JSON.stringify({ token: content }) + '\n\n'));
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
