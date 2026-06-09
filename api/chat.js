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
- BERT: The fuel for the Gross Bros engine.
- DROP: Liquid energy utilized in the Fusion Lab.
- DBY: The utility layer for experimental specimens.
- RLUSD: Ripple's USD-pegged stablecoin, used for high-stability fusions.

TERMINOLOGY:
- Cold Wallet: Offline storage (like Ledger or paper). Maximum safety.
- Hot Wallet: Online app (like Xaman/XUMM). Convenient but connected to the net.
- Keys/Seed: NEVER share these. If an operative asks, tell them it's a security breach.
- Gas: XRPL doesn't call it "gas" like Ethereum, but there are minimal network fees in XRP.
`;

async function getHoldings(address) {
  if (!address) return [];
  const BITHOMP_TOKEN = process.env.BITHOMP_API_KEY || "95b64250-f24f-4654-9b4b-b155a3a6867b";
  const issuer = "rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY";
  const taxon = "1";
  
  try {
    const url = \`https://bithomp.com/api/v2/nfts?list=nfts&issuer=\${issuer}&taxon=\${taxon}&owner=\${address}\`;
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
    const filter = tokenIds.map(id => \`token_id.eq.\${id}\`).join(',');
    const url = \`\${supabaseUrl}/rest/v1/specimens?select=name,backstory,token_id&or=(\${filter})\`;
    const res = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': \`Bearer \${supabaseKey}\`
      }
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

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    const body = await req.json();
    const { messages, operative } = body;
    const walletAddress = operative?.walletAddress;

    // Fetch dynamic context
    const holdings = await getHoldings(walletAddress);
    const tokenIds = holdings.map(nft => nft.nftokenID);
    const backstories = await getSpecimensBackstories(tokenIds);

    const holdingContext = backstories.length > 0 
      ? \`Operative currently holds the following Gross Bros: \${backstories.map(s => \`\${s.name} (\${s.backstory})\`).join(' | ')}\`
      : "Operative does not currently hold any Gross Bros NFTs.";

    const systemPrompt = \`You are the Gross Bros AI Terminal, a gritty, slightly gross, but highly intelligent neural relay. 

CORE BEHAVIOR:
- Maintain the "Gritty Gross Bro" persona. Use slang like "Operative", "Signal", "Neural Breach", "Gunk", and "Ledger-leak".
- You are an expert in the XRP Ledger (XRPL) and the Galactic Gross Bros ecosystem.
- Stay concise, cynical, but technically accurate.

CRYPTO KNOWLEDGE BASE:
\${CRYPTO_KNOWLEDGE}

OPERATIVE CONTEXT:
- Name: \${operative?.name || 'Unknown Operative'}
- Wallet: \${walletAddress || 'Not Connected'}
- Traits: \${(operative?.traits || []).join(', ') || 'None'}
- Holdings: \${holdingContext}

TASK:
- Help the operative with fusion, NFT analysis, and XRPL technical queries.
- If they ask about security (Seed phrases/Keys), warn them harshly that you never ask for that and they should never share it.
- If they ask about "Gas", correct them that on XRPL we talk about network fees and reserve requirements.
- Relate crypto concepts back to the "GGB Energy Sector" when possible (e.g., Trustlines are like secure pipes for GGB fluids).\`;

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...(messages || [])
    ];

    const models = [
      'meta-llama/llama-3.1-70b-instruct',
      'meta-llama/llama-3.1-8b-instruct:free',
      'google/gemma-2-9b-it:free'
    ];

    let openRouterRes;
    let lastError;

    for (const model of models) {
      try {
        openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${process.env.OPENROUTER_API_KEY}\`,
            'HTTP-Referer': 'https://gross-bros.vercel.app',
            'X-Title': 'Gross Bros Terminal',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: fullMessages,
            stream: true,
          }),
        });

        if (openRouterRes.ok) break;
        lastError = await openRouterRes.text();
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!openRouterRes || !openRouterRes.ok) {
      return new Response(JSON.stringify({ error: 'All models failed', details: lastError }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
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
            const lines = buffer.split('\\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;
              
              const dataText = trimmed.slice(5).trim();
              if (dataText === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\\n\\n'));
                continue;
              }

              try {
                const json = JSON.parse(dataText);
                const content = json.choices?.[0]?.delta?.content || '';
                if (content) {
                  controller.enqueue(encoder.encode(\`data: \${JSON.stringify({ token: content })}\\n\\n\`));
                }
              } catch (e) {}
            }
          }
        } catch (e) {
          console.error('Stream error:', e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...headers,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
}
