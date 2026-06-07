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
  
  const GGB_ISSUER = "rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY";
  
  // Try Treasury B first (most active), then Treasury A
  const treasuries = [
    "rNCY8dCi23nfyG74v8uE8V1G8Q8K265z6R", // Treasury B (Confirmed with NFTs)
    "rsuHaTvJh1bDmDoxX9QcKP7HEBSBt4XsHx"  // Treasury A
  ];

  let nfts = [];
  let usedAccount = owner || "";

  try {
    if (owner) {
      nfts = await crawlAllNfts(owner);
    } else {
      // Loop through treasuries until we find NFTs
      for (const t of treasuries) {
        const found = await crawlAllNfts(t);
        if (found && found.length > 0) {
          nfts = found;
          usedAccount = t;
          break;
        }
        usedAccount = t; // Track which one we ended on if still empty
      }
    }
    
    let filtered = nfts;
    
    // Filter by issuer if checking collection
    if (issuer || !owner) {
        filtered = nfts.filter(n => n.Issuer === GGB_ISSUER);
    }
    
    // Filter by taxon if provided
    if (taxonParam !== null) {
        const taxon = parseInt(taxonParam);
        filtered = filtered.filter(n => n.NFTokenTaxon === taxon);
    }

    return new Response(JSON.stringify({ 
      v: "1.4",
      result: { 
        account_nfts: filtered,
        count: filtered.length,
        account: usedAccount,
        total_found_in_wallet: nfts.length,
        treasuries_attempted: owner ? [owner] : treasuries
      } 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0'
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
