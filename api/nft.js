export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  
  // 1. Dynamically parse search params
  const requestedOwner = searchParams.get('owner');
  const issuer = searchParams.get('issuer') || "rJZERQeN5iamnZ3MBbAmtrmjV9CiqXEhqX";
  const taxon = searchParams.get('taxon') || "1";
  const list = searchParams.get('list') || "nfts";
  
  const BITHOMP_TOKEN = process.env.BITHOMP_API_KEY || "95b64250-f24f-4654-9b4b-b155a3a6867b";
  const suppressedWallets = [
    "rNCY8dCi23nfyG74v8uE8V1G8Q8K265z6R",
    "rsuHaTvJh1bDmDoxX9QcKP7HEBSBt4XsHx"
  ];

  try {
    // 3. Build Bithomp API query URL
    let apiUrl = `https://bithomp.com/api/v2/nfts?list=${list}&issuer=${issuer}&taxon=${taxon}`;
    if (requestedOwner) {
      apiUrl += `&owner=${requestedOwner}`;
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'x-bithomp-token': BITHOMP_TOKEN
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: `Bithomp API error: ${response.status}`, details: errorText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    // 4. Filter logic
    if (data.nfts && Array.isArray(data.nfts)) {
      data.nfts = data.nfts.filter(nft => {
        const owner = nft.owner || nft.account;
        // Filter out suppressed wallets UNLESS the requested owner is that specific wallet
        if (suppressedWallets.includes(owner)) {
          return requestedOwner === owner;
        }
        return true;
      });
    }

    return new Response(JSON.stringify(data), {
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
