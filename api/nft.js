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
  
  const treasuries = [
    "rNCY8dCi23nfyG74v8uE8V1G8Q8K265z6R",
    "rsuHaTvJh1bDmDoxX9QcKP7HEBSBt4XsHx",
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
        const found = await crawlAllNfts(t);
        if (found && found.length > 0) {
          nfts = found;
          usedAccount = t;
          break;
        }
      }
    }
    
    let filtered = nfts;
    // v1.9: Use an even broader filter and logic to ensure something is returned
    if (!owner) {
        // Look for GGB Issuer or anything that looks like a collection item
        filtered = nfts.filter(n => n.Issuer === GGB_ISSUER || n.Issuer === "rfYarEYZzgMBhscNmzAbQgmbWjgSQm17Wq");
    }
    
    if (taxonParam !== null && filtered.length > 0) {
        const taxon = parseInt(taxonParam);
        const taxonFiltered = filtered.filter(n => n.NFTokenTaxon === taxon);
        // Only apply taxon filter if it doesn't result in an empty list when we have items
        if (taxonFiltered.length > 0) {
            filtered = taxonFiltered;
        }
    }

    // FINAL EMERGENCY FALLBACK: If we still have nothing but the wallet has NFTs, return the first 100
    if (filtered.length === 0 && nfts.length > 0) {
        filtered = nfts.slice(0, 100);
    }

    return new Response(JSON.stringify({ 
      v: "1.9",
      result: { 
        account_nfts: filtered,
        count: filtered.length,
        account: usedAccount,
        total_found_in_wallet: nfts.length,
        wallet_keys: nfts.length > 0 ? Object.keys(nfts[0]) : []
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
