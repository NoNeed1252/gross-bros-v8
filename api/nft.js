export const config = {
  runtime: 'edge',
};

/**
 * fetchAllGalacticGrossBrosNFTs logic
 * This function crawls the XRPL account_nfts for the issuer.
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
  const targetIssuer = issuer || GGB_ISSUER;
  const targetAccount = owner || targetIssuer;

  try {
    // Perform full crawl to ensure we get every NFT in the collection
    const nfts = await crawlAllNfts(targetAccount);
    
    // Filter by taxon if applicable
    const filtered = nfts.filter(n => n.NFTokenTaxon === taxon);

    // Return in the format expected by the frontend's loadBroOfDay: data.result.account_nfts
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
