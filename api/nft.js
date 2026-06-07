export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const issuer = searchParams.get('issuer');
  const owner = searchParams.get('owner');
  const taxon = searchParams.get('taxon') || '1';

  // Gross Bros config
  const GGB_ISSUER = "rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY";
  const targetIssuer = issuer || GGB_ISSUER;

  // We fetch account_nfts for the issuer or owner
  const targetAccount = owner || targetIssuer;
  
  // XRPL JSON-RPC Request
  const xrplBody = {
    method: "account_nfts",
    params: [
      {
        account: targetAccount,
        ledger_index: "validated"
      }
    ]
  };

  try {
    const response = await fetch("https://xrplcluster.com", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(xrplBody),
    });

    const data = await response.json();

    // Map the response to a format the frontend expects (matching either Bithomp or pure XRPL)
    // The current index.html expects data.result.account_nfts or result.nfts
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
