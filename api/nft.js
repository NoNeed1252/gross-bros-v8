export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const issuer = searchParams.get('issuer');

  if (!issuer) {
    return new Response(JSON.stringify({ error: 'Missing issuer' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch('https://xrplcluster.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'account_nfts',
        params: [{ account: issuer, ledger_index: 'validated' }],
      }),
    });

    const data = await response.json();
    
    // Filter to ensure only NFTs issued by this account are returned
    if (data.result && data.result.account_nfts) {
      data.result.account_nfts = data.result.account_nfts.filter(nft => nft.Issuer === issuer);
    }

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
