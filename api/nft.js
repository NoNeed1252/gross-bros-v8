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
        throw new Error(`XRPL Node returned ${response.status}`);
    }

    const data = await response.json();
    
    if (data.result && data.result.account_nfts) {
      allNfts = allNfts.concat(data.result.account_nfts);
      marker = data.result.marker;
    } else {
      marker = null;
    }
    
    if (attempts > 50) break; 
    
  } while (marker);

  return allNfts;
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const issuer = searchParams.get('issuer');
  const owner = searchParams.get('owner');
  const taxonParam = searchParams.get('taxon');
  
  const GGB_TREASURY = "rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY";
  const GGB_ISSUER = "rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY";
  
  // Logic: 
  // If owner is provided, check that specific wallet (User).
  // If issuer is provided, we check the TREASURY wallet (Collection).
  const targetAccount = owner || GGB_TREASURY;

  try {
    const nfts = await crawlAllNfts(targetAccount);
    
    let filtered = nfts;
    
    // If checking collection (issuer param exists), filter for tokens issued by GGB
    if (issuer) {
        filtered = nfts.filter(n => n.Issuer === GGB_ISSUER);
    }
    
    // Filter by taxon if provided
    if (taxonParam !== null) {
        const taxon = parseInt(taxonParam);
        filtered = filtered.filter(n => n.NFTokenTaxon === taxon);
    }

    return new Response(JSON.stringify({ 
      v: "1.1",
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
