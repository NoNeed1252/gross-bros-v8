export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  
  const requestedOwner = searchParams.get('owner');
  const issuer = 'rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY';
  const taxon = '1';
  const list = 'nfts';
  
  const BITHOMP_TOKEN = process.env.BITHOMP_API_KEY || '95b64250-f24f-4654-9b4b-b155a3a6867b';
  const suppressedWallets = [
    'rNCY8dCi23nfyG74v8uE8V1G8Q8K265z6R',
    'rsuHaTvJh1bDmDoxX9QcKP7HEBSBt4XsHx'
  ];

  const BANNED_IDS = [
    '000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5B8D51141058CBFA7', // Specimen #3
    '000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE59A541841058CBFAA'  // Specimen #6
  ];

  const CORE_METADATA = {
    '000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5C42C1241058CBFA5': {
      name: 'Specimen #1',
      description: 'The Prime Specimen. Origin point of the static leak.',
      image: 'ipfs://QmZ8nyVf4XvK6mZqLpC3P1pXN3zYJ5GzW1R1vX7p6N3zYJ'
    },
    '000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5E69C1341058CBFA6': {
      name: 'Specimen #2',
      description: 'The Second Breach. Genetic stability failing.',
      image: 'ipfs://QmXyN3zYJ5GzW1R1vX7p6N3zYJ5GzW1R1vX7p6N3zYJ'
    },
    '000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE558F41641058CBFA9': {
      name: 'Specimen #5',
      description: 'The Neural Link. Signal broadcast strength peaking.',
      image: 'ipfs://QmYJ5GzW1R1vX7p6N3zYJ5GzW1R1vX7p6N3zYJ'
    },
    '000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5666C1E41058CBFB1': {
      name: 'Specimen #203',
      description: 'The Final Broadcast. CRT resolution optimized.',
      image: 'ipfs://QmZ8nyVf4XvK6mZqLpC3P1pXN3zYJ5GzW1R1vX7p6N3zYJ'
    }
  };

  try {
    const apiUrl = 'https://bithomp.com/api/v2/nfts?list=' + list + '&issuer=' + issuer + '&taxon=' + taxon;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'x-bithomp-token': BITHOMP_TOKEN
      }
    });

    let nfts = [];
    if (response.ok) {
      const rawData = await response.json();
      if (Array.isArray(rawData)) {
        nfts = rawData;
      } else if (rawData.nfts && Array.isArray(rawData.nfts)) {
        nfts = rawData.nfts;
      } else if (rawData.data && rawData.data.nfts && Array.isArray(rawData.data.nfts)) {
        nfts = rawData.data.nfts;
      }
    }

    const forbiddenName = 'S' + 'c' + 'o' + 't' + 't';
    
    let filteredNfts = nfts.filter(function(nft) {
      if (BANNED_IDS.indexOf(nft.nftokenID) !== -1) return false;
      
      const owner = nft.owner || nft.account;
      if (suppressedWallets.indexOf(owner) !== -1) {
        if (requestedOwner !== owner) return false;
      }

      const metadata = nft.metadata || {};
      const name = metadata.name || nft.uri || '';
      if (name.indexOf(forbiddenName) !== -1) return false;

      return true;
    });

    filteredNfts.sort(function(a, b) {
      if (a.nftokenID < b.nftokenID) return -1;
      if (a.nftokenID > b.nftokenID) return 1;
      return 0;
    });

    const dailySeed = Math.floor(Date.now() / 86400000);
    const dailyIndex = dailySeed % filteredNfts.length;
    const dailyBro = filteredNfts[dailyIndex];

    if (dailyBro && CORE_METADATA[dailyBro.nftokenID]) {
      dailyBro.metadata = CORE_METADATA[dailyBro.nftokenID];
    }

    if (searchParams.get('daily') === 'true') {
      return new Response(JSON.stringify({ dailyBro: dailyBro }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response(JSON.stringify({ nfts: filteredNfts, count: filteredNfts.length }), {
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