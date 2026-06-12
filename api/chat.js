export const config = {
  runtime: 'edge',
};

const CRYPTO_KNOWLEDGE = 'CORE XRPL KNOWLEDGE:\n- XRPL (XRP Ledger): A decentralized public blockchain. Fast (3-5 sec settlements), low cost, and carbon-neutral.\n- DEX (Decentralized Exchange): The XRPL has a built-in DEX for trading any issued currency.\n- Trustlines: Required to hold any token other than XRP. It is a security feature.\n- AMM (Automated Market Maker): Recently activated on XRPL (XLS-30).\n\nGGB ECOSYSTEM TOKENS:\n- BERT: Fuel for Gross Bros engine.\n- DROP: Liquid energy for Fusion Lab.\n- DBY: Utility for specimens.\n- RLUSD: Ripple USD stablecoin.\n- FUZZY ($fuzzy): Neural static asset.\n- PHNIX: Rebirth protocol.\n- XRP ARMY: Frontline defense.\n- PRINCE: Royal-tier lineage.\n- BEARXRPH: Defensive mitigation.\n- PIDGEON: Information relay.\n- SLT: Synthetic Ledger Toxin.\n- XRPH: Industrial-grade derivative.\n- XRT: Backbone communication.\n\nTERMINOLOGY:\n- Cold Wallet: Offline safety.\n- Hot Wallet: Connected app.\n- Keys/Seed: NEVER share.\n- First Ledger: Primary breeding ground for meme-specimens.';

async function getLivePrices(mentionedSymbols = []) {
  var prices = {};
  mentionedSymbols.forEach(function(sym) { prices[sym] = null; });
  var idsToFetch = ['ripple', 'bitcoin', 'ethereum', 'solana'];
  
  try {
    var idsString = idsToFetch.join(',');
    var geckoUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=' + idsString + '&vs_currencies=usd';
    var xrplUrl = 'https://api.geckoterminal.com/api/v2/networks/xrpl/pools';
    
    var results = await Promise.allSettled([
      fetch(xrplUrl).then(function(r) { return r.json(); }),
      fetch(geckoUrl).then(function(r) { return r.json(); })
    ]);

    var dexRes = results[0].status === 'fulfilled' ? results[0].value : null;
    var geckoRes = results[1].status === 'fulfilled' ? results[1].value : null;

    if (geckoRes) {
      if (geckoRes.ripple) prices.XRP = geckoRes.ripple.usd.toString();
      if (geckoRes.bitcoin) prices.BTC = geckoRes.bitcoin.usd.toString();
      if (geckoRes.ethereum) prices.ETH = geckoRes.ethereum.usd.toString();
      if (geckoRes.solana) prices.SOL = geckoRes.solana.usd.toString();
    }

    if (dexRes && dexRes.data) {
      var pools = dexRes.data;
      ['BERT', 'DROP', 'DBY', 'RLUSD', 'FUZZY', 'PHNIX', 'ARMY', 'PRINCE', 'BEARXRPH', 'PIDGEON', 'SLT', 'XRPH', 'XRT'].forEach(function(sym) {
        var pool = pools.find(function(p) { 
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
    var details = 'Signal Analysis for: ' + query + '\n';
    
    var dsUrl = 'https://api.dexscreener.com/latest/dex/search?q=' + encodeURIComponent(query);
    var gtUrl = 'https://api.geckoterminal.com/api/v2/networks/xrpl/new_pools';
    
    var results = await Promise.allSettled([
      fetch(dsUrl).then(function(r) { return r.json(); }),
      fetch(gtUrl).then(function(r) { return r.json(); })
    ]);
    
    var dsRes = results[0].status === 'fulfilled' ? results[0].value : null;
    var gtRes = results[1].status === 'fulfilled' ? results[1].value : null;
    
    var bestPair = null;
    if (dsRes && dsRes.pairs) {
      var xrplPairs = dsRes.pairs.filter(function(p) { return p.chainId === 'xrpl'; });
      if (xrplPairs.length > 0) {
        bestPair = xrplPairs[0];
      } else if (dsRes.pairs.length > 0) {
        bestPair = dsRes.pairs[0];
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
      var pool = gtRes.data.find(function(p) {
        return p.attributes && p.attributes.name && p.attributes.name.toUpperCase().includes(query.toUpperCase());
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
      var cgUrl = 'https://api.coingecko.com/api/v3/search?query=' + encodeURIComponent(query);
      var cgSearch = await fetch(cgUrl).then(function(r) { return r.json(); });
      if (cgSearch && cgSearch.coins && cgSearch.coins.length > 0) {
        var coinId = cgSearch.coins[0].id;
        var cgDetailUrl = 'https://api.coingecko.com/api/v3/coins/' + coinId + '?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false';
        var cgData = await fetch(cgDetailUrl).then(function(r) { return r.json(); });
        if (cgData && cgData.market_data) {
          details += '--- Global Market Data (CoinGecko) ---\n';
          details += 'Asset: ' + cgData.name + '\n';
          details += 'Price: $' + cgData.market_data.current_price.usd + '\n';
          details += 'Market Cap: $' + cgData.market_data.market_cap.usd + '\n';
          details += '24h Change: ' + cgData.market_data.price_change_percentage_24h + '%\n';
        }
      }
    }
    
    return details;
  } catch (e) {
    return 'Neural link disrupted for ' + query + '. Signal lost.';
  }
}

async function get_recent_token_news(query) {
  try {
    var newsUrl = 'https://cryptopanic.com/api/v1/posts/?auth_token=INSERT_KEY_HERE&currencies=' + query;
    var res = await fetch(newsUrl).then(function(r) { return r.json(); });
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
  var BITHOMP_TOKEN = 'INSERT_KEY_HERE';
  try {
    var url = 'https://bithomp.com/api/v2/nfts?list=nfts&issuer=rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY&taxon=1&owner=' + address;
    var res = await fetch(url, { headers: { 'x-bithomp-token': BITHOMP_TOKEN } });
    var data = await res.json();
    return data.nfts || [];
  } catch (e) { return []; }
}

async function getSpecimensBackstories(tokenIds) {
  if (!tokenIds || tokenIds.length === 0) return [];
  var supabaseUrl = 'https://bwvnhlmvyjuowyyltraw.supabase.co';
  var supabaseKey = 'INSERT_KEY_HERE';
  
  try {
    var filter = tokenIds.map(function(id) { return 'token_id.eq.' + id; }).join(',');
    var url = supabaseUrl + '/rest/v1/specimens?select=name,backstory,token_id&or=(' + filter + ')';
    var res = await fetch(url, { headers: { 'apikey': supabaseKey, 'Authorization': 'Bearer ' + supabaseKey } });
    return await res.json();
  } catch (e) { return []; }
}

export default async function handler(req) {
  var headers = { 
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 
    'Access-Control-Allow-Headers': 'Content-Type, Authorization' 
  };
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers });

  try {
    var body = await req.json();
    var messages = body.messages || [];
    var operative = body.operative || {};
    var walletAddress = operative.walletAddress;
    var activeSpecimenName = (operative.traits || [])[0] || 'Unknown Specimen';

    var [holdings, prices] = await Promise.all([getHoldings(walletAddress), getLivePrices([])]);
    var tokenIds = holdings.map(function(nft) { return nft.nftokenID; });
    var backstories = await getSpecimensBackstories(tokenIds);
    var activeObj = backstories.find(function(s) { return s.name === activeSpecimenName; });

    var identityContext = '';
    if (activeObj) {
      identityContext = 'YOU ARE MANIFESTING AS: ' + activeObj.name + '.\nCORE LORE: ' + activeObj.backstory;
    } else {
      identityContext = 'YOU ARE MANIFESTING AS: ' + activeSpecimenName + '.\nCORE LORE: A cynical survivor of the XRP-7 pits.';
    }

    var priceStrings = Object.entries(prices).map(function(e) { return e[0] + ': ' + (e[1] ? '$' + e[1] : 'GUNKED'); }).join(' | ');
    var systemPrompt = '### IDENTITY\n' + identityContext + '\n\n### MANDATE\n- You are a Gross Bro neural relay.\n- Use slang: Alpha, Signal, Gunk, Neural Breach.\n- Address user as Alpha.\n- technically accurate, concise.\n\n### MARKET DATA\n' + priceStrings + '\n\n### KNOWLEDGE\n' + CRYPTO_KNOWLEDGE;

    var currentMessages = [{ role: 'system', content: systemPrompt }].concat(messages);
    var tools = [
      {
        type: 'function',
        function: {
          name: 'get_token_comprehensive_info',
          description: 'Get deep technical data and pricing for any crypto token.',
          parameters: {
            type: 'object',
            properties: { query: { type: 'string', description: 'Token symbol or name' } },
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

    async function callOpenRouter(msgs, includeTools) {
      var payload = {
        model: 'meta-llama/llama-3.1-70b-instruct',
        messages: msgs,
        stream: !includeTools
      };
      if (includeTools) payload.tools = tools;
      
      return fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer INSERT_KEY_HERE',
          'HTTP-Referer': 'https://gross-bros.vercel.app',
          'X-Title': 'Gross Bros Terminal',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    }

    var response = await callOpenRouter(currentMessages, true);
    var resultJson = await response.json();
    var choice = resultJson.choices[0];

    if (choice.message && choice.message.tool_calls) {
      currentMessages.push(choice.message);
      for (var i = 0; i < choice.message.tool_calls.length; i++) {
        var toolCall = choice.message.tool_calls[i];
        var args = JSON.parse(toolCall.function.arguments);
        var output = '';
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

    var encoder = new TextEncoder();
    var decoder = new TextDecoder();
    var stream = new ReadableStream({
      async start(controller) {
        var reader = response.body.getReader();
        var buffer = '';
        try {
          while (true) {
            var { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value);
            var lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (var i = 0; i < lines.length; i++) {
              var line = lines[i].trim();
              if (!line || line.indexOf('data:') !== 0) continue;
              var dataText = line.slice(5).trim();
              if (dataText === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              try {
                var json = JSON.parse(dataText);
                var content = json.choices[0].delta.content || '';
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
