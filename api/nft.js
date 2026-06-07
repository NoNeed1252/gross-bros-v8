export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const xrplBody = {
    method: "account_nfts",
    params: [
      {
        account: "rsuHaTvJh1bDmDoxX9QcKP7HEBSBt4XsHx",
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

    return new Response(JSON.stringify({
      v: "4",
      raw: data
    }), {
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
