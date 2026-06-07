export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const issuer = searchParams.get('issuer');
  const owner = searchParams.get('owner');
  const taxon = searchParams.get('taxon') || '1';
  const list = searchParams.get('list') || 'nfts';

  // Build the Bithomp URL based on provided params
  let bithompUrl = `https://bithomp.com/api/v2/nfts?taxon=${taxon}&list=${list}`;
  if (issuer) bithompUrl += `&issuer=${issuer}`;
  if (owner) bithompUrl += `&owner=${owner}`;

  try {
    const response = await fetch(bithompUrl, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
      },
    });

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
