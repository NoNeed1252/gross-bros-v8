export const config = {
  runtime: 'edge',
};

async function crawlAllNfts(account) {
  const xrplBody = {
    method: "account_nfts",
    params: [
      {
        account: account,
        ledger_index: "validated"
      }
    ]
  };

  const response = await fetch("https://xrplcluster.com", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(xrplBody),
  });

  return await response.json();
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get('owner') || "rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY";

  try {
    const data = await crawlAllNfts(owner);
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
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
