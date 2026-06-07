export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Hardcoded issuer per user instructions
  const issuer = "rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY";
  const BITHOMP_TOKEN = process.env.BITHOMP_API_KEY || "95b64250-f24f-4654-9b4b-b155a3a6867b";

  try {
    const url = `https://bithomp.com/api/v2/nfts?taxon=1&list=nfts&issuer=${issuer}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'x-bithomp-token': BITHOMP_TOKEN
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: `Bithomp API error: ${response.status}`, details: errorText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
