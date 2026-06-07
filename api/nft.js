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
  
  // LOGIC FIX: 
  // For 'Bro of the Day', the frontend wants nfts from the ISSUER address (the collection source).
  // For 'User NFTs', the frontend wants nfts from the OWNER address (the user's wallet).
  // The frontend was passing 'issuer' and 'taxon' for collection, but 'owner' for user.
  
  // If owner is provided, use it (User check).
  // If issuer is provided, use it (Collection check).
  // Default to the GGB Treasury.
  const GGB_TREASURY = "rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY";
  const targetAccount = owner || issuer || GGB_TREASURY;

  try {
    const nfts = await crawlAllNfts(targetAccount);
    
    // Filtering
    let filtered = nfts;
    
    // If we are looking for the collection, we filter by the actual issuer of the tokens
    // because the treasury might hold other tokens too.
    if (issuer) {
        filtered = nfts.filter(n => n.Issuer === issuer);
    }
    
    // Filter by taxon if provided
    if (taxonParam !== null) {
        const taxon = parseInt(taxonParam);
        filtered = filtered.filter(n => n.NFTokenTaxon === taxon);
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
