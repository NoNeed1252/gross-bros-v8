export const config = {
  runtime: 'edge',
};

async function crawlAllNfts(account) {
  let allNfts = [];
  let marker = null;
  let attempts = 0;
  
  do {
    attempts++;
    const xrplBody = {
      method: "account_nfts",
      params: [
        {
          account: account,
          ledger_index: "validated",
          limit: 400,
          marker: marker
        }
      ]
    };

    const response = await fetch("https://xrplcluster.com", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(xrplBody),
    });

    if (!response.ok) {
        throw new Error(`XRPL Node returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    if (data.error) {
        throw new Error(`XRPL Error: ${data.error_message || data.error}`);
    }

    if (data.result && data.result.account_nfts) {
      allNfts = allNfts.concat(data.result.account_nfts);
      marker = data.result.marker;
    } else {
      marker = null;
    }
    
    // Safety break to prevent infinite loops in edge runtime
    if (attempts > 50) break; 
    
  } while (marker);

  return allNfts;
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const issuer = searchParams.get('issuer');
  const owner = searchParams.get('owner');
  const taxonParam = searchParams.get('taxon');
  
  // Logic: If 'owner' is provided, we fetch NFTs held by that wallet.
  // If 'owner' is NOT provided, we fetch NFTs held by the 'issuer' (the treasury/mint wallet).
  const GGB_ISSUER = "rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY";
  const targetAccount = owner || issuer || GGB_ISSUER;

  try {
    const nfts = await crawlAllNfts(targetAccount);
    
    // Filter by taxon if provided, otherwise return all from that account
    let filtered = nfts;
    if (taxonParam !== null) {
        const taxon = parseInt(taxonParam);
        filtered = nfts.filter(n => n.NFTokenTaxon === taxon);
    }

    return new Response(JSON.stringify({ 
      result: { 
        account_nfts: filtered,
        count: filtered.length,
        account: targetAccount
      } 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
