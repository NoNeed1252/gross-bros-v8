export const config = {
  runtime: 'edge',
};

/**
 * fetchAllGalacticGrossBrosNFTs logic
 * This function crawls the XRPL account_nfts for the treasury/issuer.
 */
async function crawlAllNfts(account) {
  let allNfts = [];
  let marker = null;
  
  do {
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

    const data = await response.json();
    if (data.result && data.result.account_nfts) {
      allNfts = allNfts.concat(data.result.account_nfts);
      marker = data.result.marker;
    } else {
      marker = null;
    }
  } while (marker);

  return allNfts;
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const issuer = searchParams.get('issuer');
  const owner = searchParams.get('owner');
  const taxon = parseInt(searchParams.get('taxon') || '1');

  const GGB_ISSUER = "rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY";
  const GGB_TREASURY = "rNCY8dCi23nfyG74v8uE8V1G8Q8K265z6R";
  
  // Logic: 
  // 1. If explicit 'owner' param provided, crawl that.
  // 2. Otherwise, crawl the GGB_TREASURY where the actual NFTs live.
  // 3. Fallback to GGB_ISSUER if both fail.
  const targetAccount = owner || GGB_TREASURY || issuer || GGB_ISSUER;

  try {
    let nfts = await crawlAllNfts(targetAccount);
    
    // Fallback logic: If treasury is empty, try the issuer
    if (nfts.length === 0 && targetAccount !== GGB_ISSUER) {
      nfts = await crawlAllNfts(GGB_ISSUER);
    }
    
    // Filter by taxon if applicable
    const filtered = nfts.filter(n => n.NFTokenTaxon === taxon);

    return new Response(JSON.stringify({ 
      result: { 
        account_nfts: filtered 
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
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
