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
    
    // DEBUG: Log the raw result keys
    // console.log("XRPL keys:", Object.keys(data.result || {}));

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
  let usedAccount = owner || "";
  let rawResponseExample = null;

  try {
    // Single debug fetch for raw response format check
    const debugAccount = owner || treasuries[0];
    const xrplRes = await fetch("https://xrplcluster.com", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: "account_nfts",
        params: [{ account: debugAccount, ledger_index: "validated", limit: 1 }]
      }),
    });
    rawResponseExample = await xrplRes.json();

    if (owner) {
      nfts = await crawlAllNfts(owner);
    } else {
      for (const t of treasuries) {
        const found = await crawlAllNfts(t);
        if (found && found.length > 0) {
          nfts = found;
          usedAccount = t;
          break;
        }
        usedAccount = t;
      }
    }
    
    let filtered = nfts;
    if (issuer || !owner) {
        filtered = nfts.filter(n => n.Issuer === GGB_ISSUER);
    }
    if (taxonParam !== null) {
        const taxon = parseInt(taxonParam);
        filtered = filtered.filter(n => n.NFTokenTaxon === taxon);
    }

    return new Response(JSON.stringify({ 
      v: "1.5",
      debug: {
        raw_keys: rawResponseExample ? Object.keys(rawResponseExample.result || {}) : [],
        raw_full: rawResponseExample
      },
      result: { 
        account_nfts: filtered,
        count: filtered.length,
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
