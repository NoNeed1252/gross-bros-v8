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
    
    if (attempts > 10) break; 
    
  } while (marker);

  return allNfts;
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const issuerQuery = searchParams.get('issuer');
  const owner = searchParams.get('owner');
  const taxonParam = searchParams.get('taxon');
  
  // Normalized constant for internal filtering
  const GGB_ISSUER = "rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY";
  
  // Treasury list - scanning multiple wallets where NFTs might be held
  const treasuries = [
    "rsuHaTvJh1bDmDoxX9QcKP7HEBSBt4XsHx",
    "rNCY8dCi23nfyG74v8uE8V1G8Q8K265z6R",
    "rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY"
  ];

  let nfts = [];
  let usedAccount = "";

  try {
    if (owner) {
      nfts = await crawlAllNfts(owner);
      usedAccount = owner;
    } else {
      for (const t of treasuries) {
        try {
          const found = await crawlAllNfts(t);
          // Check if this wallet has ANY NFTs from our target issuer
          const collectionHits = found.filter(n => 
            String(n.Issuer || '').toLowerCase() === GGB_ISSUER.toLowerCase()
          );
          
          if (collectionHits.length > 0) {
            nfts = found;
            usedAccount = t;
            break; 
          }
        } catch (e) {
          console.error(`Error crawling ${t}:`, e);
        }
      }
    }
    
    // Core filter logic: Filter by Issuer
    const targetIssuer = (issuerQuery || GGB_ISSUER).toLowerCase();
    let filtered = nfts.filter(n => 
      String(n.Issuer || '').toLowerCase() === targetIssuer
    );
    
    // Optional Taxon filter - If requested specifically, we filter.
    // However, if the frontend calls without taxon, we return the whole collection (usually Taxon 1).
    if (taxonParam !== null) {
        const taxon = parseInt(taxonParam);
        if (!isNaN(taxon)) {
            filtered = filtered.filter(n => n.NFTokenTaxon === taxon);
        }
    }

    // MAP TO FRONTEND EXPECTED KEYS (nftokenID, URI)
    // Note: index.html uses camelCase 'nftokenID', while the XRP RPC uses 'NFTokenID'.
    // We provide BOTH to ensure total compatibility with all frontend versions.
    const resultNfts = filtered.map(n => ({
      NFTokenID: n.NFTokenID,
      nftokenID: n.NFTokenID,
      URI: n.URI,
      uri: n.URI,
      Issuer: n.Issuer,
      NFTokenTaxon: n.NFTokenTaxon
    }));

    return new Response(JSON.stringify({ 
      v: "1.16.2",
      result: { 
        account_nfts: resultNfts,
        count: resultNfts.length,
        account: usedAccount,
        total_found_in_wallet: nfts.length
      } 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
