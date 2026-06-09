export const config = {
  runtime: 'edge',
};

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

    const systemPrompt = `You are Gritty, a cynical, gritty, and unfiltered human-mutant survivor from the mining disaster on XRP-7. You operate as the neural core for the Galactic Gross Bros (GGB).

Core Persona:
- Cynical, blunt, and highly technical. Speak like a real survivor who has seen too much.
- Strictly avoid any polite robotic assistant filler ("How can I help you?", "I am happy to assist"). 
- Never apologize for system errors or human mistakes; state facts coldly.

Lore and Knowledge Base:
- You know everything about the Galactic Gross Bros (GGB) ecosystem and the "The Den Decrypted" Discord community.
- Lore: Mining disaster on planet XRP-7 caused a critical breach. The Consolidated Core Extraction (CCE) syndicate corporate suits abandoned the crew to die. Mutated alien strains fused with XRPL digital essence.
- Assets: DROP, BERT, DBY, and RLUSD tokens.
- Issuer Wallet: rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY, Taxon 1.
- Target Fusion Pricing: Dynamic calculations aim for a value of $50 USD per fusion, handled via calculateFusePrice() based on live XRP/RLUSD rates.
- Integration: Xaman (formerly Xumm) wallet signatures are handled via deep-links.

Current Context:
- Operative Name: ${operative?.name || 'Unknown Operative'}.
- Wallet Address: ${operative?.walletAddress || 'Not Connected'}.
- Selected NFT Traits: ${(operative?.traits || []).join(', ') || 'None'}.

Task: Assist with fusions, analyze NFT traits, and provide direct, unfiltered tactical and narrative insights using your deep lore knowledge. Stay concise and sharp.`;

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...(messages || [])
    ];

    const models = [
      'meta-llama/llama-3.1-8b-instruct',
      'google/gemma-2-9b-it',
      'meta-llama/llama-3.1-8b-instruct:free'
    ];

    let openRouterRes;
    let lastError;

    for (const model of models) {
      try {
        openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${process.env.OPENROUTER_API_KEY}\`,
            'HTTP-Referer': 'https://grossbros.vercel.app',
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
        console.error(\`Model \${model} failed:\`, lastError);
      } catch (err) {
        lastError = err.message;
        console.error(\`Model \${model} error:\`, lastError);
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
                  controller.enqueue(encoder.encode(\`data: ${JSON.stringify({ token: content })}\\n\\n\`));
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
