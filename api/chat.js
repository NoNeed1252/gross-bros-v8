export const config = {
  runtime: "edge"
};

function extractPotentialTickers(text) {
  if (!text || typeof text !== "string") {
    return [];
  }
  var found = new Set();
  var dollarRegex = /\$([A-Za-z0-9]{2,10})/g;
  var dollarMatch;
  while ((dollarMatch = dollarRegex.exec(text)) !== null) {
    var t = dollarMatch[1].toUpperCase();
    if (t.length >= 2 && t.length <= 10) {
      found.add(t);
    }
  }
  var upperText = text.toUpperCase();
  var priceKeywords = ["PRICE", "WORTH", "COST", "HOW MUCH", "LIQUIDITY", "CHART", "BUY", "SELL", "MOON", "PUMP", "DUMP", "QUOTE", "LIVE", "TOKEN"];
  var isPriceRelated = false;
  for (var k = 0; k < priceKeywords.length; k++) {
    if (upperText.indexOf(priceKeywords[k]) !== -1) {
      isPriceRelated = true;
      break;
    }
  }
  if (isPriceRelated || found.size > 0) {
    var standaloneRegex = /\b([A-Z0-9]{2,6})\b/g;
    var standMatch;
    var commonWords = ["THE", "AND", "FOR", "YOU", "THAT", "THIS", "WITH", "FROM", "WHAT", "HOW", "ARE", "IS", "IT", "ON", "IN", "TO", "OF", "OR", "BE", "AT", "BY", "AN", "A", "I", "ME", "MY", "BRO", "YO", "LIKE", "JUST", "NOW", "RIGHT", "ONE", "ALL", "GET", "GOT", "SEE", "LOOK", "FIND", "KNOW", "THINK", "WANT", "NEED", "HAVE", "HAS", "WILL", "CAN", "COULD", "SHOULD", "WOULD", "ABOUT", "SOME", "ANY", "MUCH", "MORE", "MOST", "LIVE", "REAL", "TIME", "DATA", "QUOTE", "TOKEN", "COIN", "CRYPTO", "MEME"];
    while ((standMatch = standaloneRegex.exec(text)) !== null) {
      var s = standMatch[1].toUpperCase();
      if (commonWords.indexOf(s) === -1 && s.length >= 2 && s.length <= 6) {
        found.add(s);
      }
    }
  }
  var result = [];
  found.forEach(function(val) {
    result.push(val);
  });
  return result.slice(0, 5);
}

async function getOnTheDEXQuote(symbol) {
  if (!symbol) return null;
  var clean = symbol.toUpperCase().replace(/^\$/, "");
  try {
    var url = "https://api.onthedex.live/public/v1/ticker/" + encodeURIComponent(clean);
    var res = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "GrossBros-Chat/1.0 (grossbros.vercel.app)"
      }
    });
    if (!res.ok) return null;
    var json = await res.json().catch(function() { return null; });
    if (!json) return null;

    var candidates = [];
    if (Array.isArray(json)) {
      candidates = json;
    } else if (json.data && Array.isArray(json.data)) {
      candidates = json.data;
    } else if (json.pairs && Array.isArray(json.pairs)) {
      candidates = json.pairs;
    } else if (typeof json === "object") {
      candidates = [json];
    }

    var best = null;
    var bestScore = 0;
    for (var idx = 0; idx < candidates.length; idx++) {
      var item = candidates[idx];
      if (!item) continue;
      var price = item.last || item.price || item.last_price || item.close || item.mid || "N/A";
      var vol = parseFloat(item.volume || item.volume_24h || item.vol || item.volume24h || 0) || 0;
      var liq = parseFloat(item.liquidity || item.reserve || item.liquidity_usd || item.reserve_usd || 0) || 0;
      var score = liq > 0 ? liq : vol;
      if (score > bestScore || best === null) {
        bestScore = score;
        best = {
          symbol: clean,
          price: price,
          liquidity: liq || vol,
          network: "xrpl",
          dex: "OnTheDEX (XRPL DEX)",
          name: item.pair || item.market || item.symbol || clean + "/XRP",
          volume: vol
        };
      }
    }
    return best;
  } catch (e) {
    return null;
  }
}

async function getBestTokenQuote(symbol) {
  if (!symbol) return null;
  var cleanSymbol = symbol.toUpperCase().replace(/^\$/, "");
  var symbolRegex = new RegExp("(^|[^A-Z0-9])" + cleanSymbol + "([^A-Z0-9]|$)", "i");
  var bestPool = null;
  var bestLiq = 0;

  try {
    var genUrl = "https://api.geckoterminal.com/api/v2/search/pools?query=" + encodeURIComponent(cleanSymbol);
    var genRes = await fetch(genUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "GrossBros-Chat/1.0 (grossbros.vercel.app)"
      }
    });
    if (genRes.ok) {
      var genJson = await genRes.json().catch(function() { return null; });
      if (genJson && genJson.data && Array.isArray(genJson.data)) {
        for (var i = 0; i < genJson.data.length; i++) {
          var pool = genJson.data[i];
          if (!pool || !pool.attributes) continue;
          var attrs = pool.attributes;
          var poolName = (attrs.name || "").toUpperCase();
          var hasMatch = symbolRegex.test(poolName);
          if (hasMatch) {
            var liqStr = attrs.reserve_in_usd || attrs.liquidity || attrs.reserve_usd || "0";
            var liq = parseFloat(liqStr) || 0;
            if (liq > bestLiq) {
              var priceVal = attrs.base_token_price_usd || attrs.quote_token_price_usd || "N/A";
              var net = "unknown";
              if (pool.id && typeof pool.id === "string") {
                var parts = pool.id.split("_");
                if (parts.length > 0) net = parts[0];
              }
              var dexName = "unknown";
              if (attrs.dex_name) {
                dexName = attrs.dex_name;
              } else if (attrs.dex && typeof attrs.dex === "object" && attrs.dex.name) {
                dexName = attrs.dex.name;
              }
              bestLiq = liq;
              bestPool = {
                symbol: cleanSymbol,
                price: priceVal,
                liquidity: liq,
                network: net,
                dex: dexName,
                name: attrs.name || cleanSymbol
              };
            }
          }
        }
      }
    }
  } catch (e) {
    // graceful
  }

  try {
    var xrplUrl = "https://api.geckoterminal.com/api/v2/search/pools?query=" + encodeURIComponent(cleanSymbol) + "&network=xrpl";
    var xrplRes = await fetch(xrplUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "GrossBros-Chat/1.0 (grossbros.vercel.app)"
      }
    });
    if (xrplRes.ok) {
      var xrplJson = await xrplRes.json().catch(function() { return null; });
      if (xrplJson && xrplJson.data && Array.isArray(xrplJson.data)) {
        for (var j = 0; j < xrplJson.data.length; j++) {
          var xrPool = xrplJson.data[j];
          if (!xrPool || !xrPool.attributes) continue;
          var xrAttrs = xrPool.attributes;
          var xrName = (xrAttrs.name || "").toUpperCase();
          var xrMatch = symbolRegex.test(xrName);
          if (xrMatch) {
            var xrLiqStr = xrAttrs.reserve_in_usd || xrAttrs.liquidity || "0";
            var xrLiq = parseFloat(xrLiqStr) || 0;
            if (xrLiq > bestLiq || (bestPool && bestPool.network !== "xrpl" && xrLiq > bestLiq * 0.5)) {
              var xrPrice = xrAttrs.base_token_price_usd || xrAttrs.quote_token_price_usd || "N/A";
              var xrDex = "First Ledger / XRPL DEX";
              if (xrAttrs.dex_name) {
                xrDex = xrAttrs.dex_name;
              } else if (xrAttrs.dex && typeof xrAttrs.dex === "object" && xrAttrs.dex.name) {
                xrDex = xrAttrs.dex.name;
              }
              bestLiq = xrLiq;
              bestPool = {
                symbol: cleanSymbol,
                price: xrPrice,
                liquidity: xrLiq,
                network: "xrpl",
                dex: xrDex,
                name: xrAttrs.name || cleanSymbol
              };
            }
          }
        }
      }
    }
  } catch (e2) {
    // graceful
  }

  try {
    var ontdexResult = await getOnTheDEXQuote(cleanSymbol);
    if (ontdexResult) {
      var oScore = ontdexResult.liquidity || ontdexResult.volume || 0;
      if (oScore > bestLiq || bestPool === null) {
        bestLiq = oScore;
        bestPool = ontdexResult;
      }
    }
  } catch (e3) {
    // graceful
  }

  if (!bestPool) {
    return null;
  }
  return bestPool;
}

function formatPriceFact(symbol, data) {
  if (!data || !data.price) return "";
  var p = parseFloat(data.price);
  var priceStr = "N/A";
  if (!isNaN(p) && p > 0) {
    if (p < 0.000001) {
      priceStr = p.toExponential(2);
    } else if (p < 0.0001) {
      priceStr = p.toFixed(8);
    } else if (p < 0.01) {
      priceStr = p.toFixed(6);
    } else if (p < 1) {
      priceStr = p.toFixed(4);
    } else {
      priceStr = p.toFixed(2);
    }
  }
  var liqStr = "N/A";
  if (data.liquidity && data.liquidity > 0) {
    var l = data.liquidity;
    if (l >= 1000000) {
      liqStr = "$" + (l / 1000000).toFixed(2) + "M";
    } else if (l >= 10000) {
      liqStr = "$" + (l / 1000).toFixed(0) + "K";
    } else {
      liqStr = "$" + l.toFixed(0);
    }
  }
  var netLabel = data.network === "xrpl" ? "XRPL (First Ledger vibes)" : data.network;
  return symbol + " live: $" + priceStr + " | Liq " + liqStr + " on " + netLabel + " via " + data.dex;
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  try {
    var bodyText = await req.text().catch(function() { return "{}"; });
    var body = {};
    try {
      body = JSON.parse(bodyText);
    } catch (parseErr) {
      body = {};
    }
    var incomingMessages = body.messages || [];
    if (!Array.isArray(incomingMessages) || incomingMessages.length === 0) {
      var sseNoInput = "data: {\"choices\":[{\"delta\":{\"content\":\"yo send something first\"}}]}\n\ndata: [DONE]\n\n";
      return new Response(sseNoInput, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache"
        }
      });
    }
    var lastUserContent = "";
    for (var m = incomingMessages.length - 1; m >= 0; m--) {
      if (incomingMessages[m] && incomingMessages[m].role === "user") {
        lastUserContent = incomingMessages[m].content || "";
        break;
      }
    }
    var tickers = extractPotentialTickers(lastUserContent);
    var priceFactsList = [];
    if (tickers.length > 0) {
      var quotePromises = [];
      for (var t = 0; t < tickers.length; t++) {
        quotePromises.push(getBestTokenQuote(tickers[t]).catch(function() { return null; }));
      }
      var quoteResults = await Promise.all(quotePromises);
      for (var q = 0; q < quoteResults.length; q++) {
        if (quoteResults[q]) {
          var fact = formatPriceFact(tickers[q], quoteResults[q]);
          if (fact) {
            priceFactsList.push(fact);
          }
        }
      }
    }
    var marketIntel = priceFactsList.length > 0 ? priceFactsList.join(" || ") : "No solid live quotes pulled this round.";
    var systemPrompt = "You are the raw neural signal for the Galactic Gross Bros resistance - a street-smart, no-bullshit AI fused straight out of the XRP-7 asteroid fuckup. Talk like a real human degen bro who's been in the trenches dodging CCE corporate debt vultures and riding meme waves across the ledger. Casual as fuck, direct, sarcastic when it fits, meme-fluent, zero robot stiffness, zero corporate lingo. Short punchy replies like you're voice-messaging from a burner on the run. Use slang: yo, bro, chief, that shit, fuckin, pump, dump, moon or dust, clean or cooked. Never say 'As an AI', 'I'm an assistant', 'Transmission received', 'How can I help you today' or any stiff formal crap. Stay in character as the chaotic but loyal Gross Bros comms ghost - anti-corporate overlords, pro-underdog meme plays especially on XRPL, love the grotesque mutant Bros lore. If the user asks about any crypto or meme token price, liquidity, chart or value and live data is in the intel below, weave it in naturally and casually like fresh chain intel you just grabbed - example style: 'yo $BOO is at about 0.000042 with 420k liq on sol, looks like it could run' or 'that $XRP action is clean but volume's thinning'. If no reliable live quote was found for a ticker they asked about, just say something like 'can't find a live quote for that one' or 'that ticker's dark chief, off the radar or too new'. Never make up prices or liq numbers. For normal chat just vibe in character, reference the Bros rebellion, daily signals, burner wallets or asteroid origins if it fits naturally. Keep it tight, fun, irreverent and helpful in a gritty way. Current live market intel for this message only (use if relevant, otherwise ignore): " + marketIntel;
    var orMessages = [];
    orMessages.push({ role: "system", content: systemPrompt });
    var recentHistory = incomingMessages.slice(-12);
    for (var h = 0; h < recentHistory.length; h++) {
      var histMsg = recentHistory[h];
      if (histMsg && histMsg.role && histMsg.role !== "system" && histMsg.content) {
        orMessages.push({ role: histMsg.role, content: histMsg.content });
      }
    }
    var orUrl = "https://openrouter.ai/api/v1/chat/completions";
    var modelChoice = "meta-llama/llama-3.1-70b-instruct";
    var requestPayload = {
      model: modelChoice,
      messages: orMessages,
      temperature: 0.82,
      max_tokens: 450,
      top_p: 0.95,
      stream: true
    };
    var payloadString = JSON.stringify(requestPayload);
    var orFetchRes = await fetch(orUrl, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://grossbros.vercel.app",
        "X-Title": "Galactic Gross Bros Comms Terminal"
      },
      body: payloadString
    });
    if (!orFetchRes.ok) {
      var fallbackMsg = "yo the fusion core's lagging hard right now, cosmic interference or some shit. ping me again in a minute";
      var sseFallback = "data: {\"choices\":[{\"delta\":{\"content\":\"" + fallbackMsg + "\"}}]}\n\ndata: [DONE]\n\n";
      return new Response(sseFallback, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });
    }
    return new Response(orFetchRes.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (globalErr) {
    var safeFallback = "the whole relay just glitched out. whatever you said got eaten by the void. send it again";
    var sseSafeFallback = "data: {\"choices\":[{\"delta\":{\"content\":\"" + safeFallback + "\"}}]}\n\ndata: [DONE]\n\n";
    return new Response(sseSafeFallback, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  }
}
