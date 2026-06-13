export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  
  const requestedOwner = searchParams.get('owner');
  const issuer = searchParams.get('issuer') || 'rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY';
  const taxon = searchParams.get('taxon') || '1';
  const list = searchParams.get('list') || 'nfts';
  
  const BITHOMP_TOKEN = process.env.BITHOMP_API_KEY || '95b64250-f24f-4654-9b4b-b155a3a6867b';
  const suppressedWallets = [
    'rNCY8dCi23nfyG74v8uE8V1G8Q8K265z6R',
    'rsuHaTvJh1bDmDoxX9QcKP7HEBSBt4XsHx'
  ];

  const CORE_METADATA = {
    '000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5C42C1241058CBFA5': {
      name: 'Specimen #1',
      description: 'The Prime Specimen. Origin point of the static leak.',
      image: 'https://grossbros.vercel.app/fallback/specimen-1.png'
    },
    '000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5E69C1341058CBFA6': {
      name: 'Specimen #2',
      description: 'The Second Breach. Genetic stability failing.',
      image: 'https://grossbros.vercel.app/fallback/specimen-2.png'
    },
    '000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE558F41641058CBFA9': {
      name: 'Specimen #5',
      description: 'The Neural Link. Signal broadcast strength peaking.',
      image: 'https://grossbros.vercel.app/fallback/specimen-5.png'
    },
    '000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5666C1E41058CBFB1': {
      name: 'Specimen #203',
      description: 'The Final Broadcast. CRT resolution optimized.',
      image: 'https://grossbros.vercel.app/fallback/specimen-203.png'
    }
  };

  const FALLBACK_BROS = [
    { nftokenID: '000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5C42C1241058CBFA5', metadata: CORE_METADATA['000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5C42C1241058CBFA5'] },
    { nftokenID: '000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5E69C1341058CBFA6', metadata: CORE_METADATA['000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5E69C1341058CBFA6'] },
    { nftokenID: '000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE558F41641058CBFA9', metadata: CORE_METADATA['000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE558F41641058CBFA9'] },
    { nftokenID: '000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5666C1E41058CBFB1', metadata: CORE_METADATA['000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5666C1E41058CBFB1'] }
  ];

  const BANNED_IDS = [
    '000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5B8D51141058CBFA7', // Specimen #3
    '000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE59A541841058CBFAA'  // Specimen #6
  ];

  try {
    let apiUrl = 'https://bithomp.com/api/v2/nfts?list=' + list + '&issuer=' + issuer + '&taxon=' + taxon;
    if (requestedOwner) {
      apiUrl += '&owner=' + requestedOwner;
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'x-bithomp-token': BITHOMP_TOKEN
      }
    });

    let data = { nfts: [] };
    if (response.ok) {
      const rawData = await response.json();
      // Handle potential Bithomp nesting: data.nfts or root array or rawData.data.nfts
      if (Array.isArray(rawData)) {
        data.nfts = rawData;
      } else if (rawData.nfts && Array.isArray(rawData.nfts)) {
        data.nfts = rawData.nfts;
      } else if (rawData.data && rawData.data.nfts && Array.isArray(rawData.data.nfts)) {
        data.nfts = rawData.data.nfts;
      }
    } else {
      data.nfts = FALLBACK_BROS;
      data.fallback = true;
    }

    if (data.nfts && Array.isArray(data.nfts)) {
      data.nfts = data.nfts.filter(function(nft) {
        if (BANNED_IDS.indexOf(nft.nftokenID) !== -1) return false;
        const owner = nft.owner || nft.account;
        if (suppressedWallets.indexOf(owner) !== -1) {
          return requestedOwner === owner;
        }
        return true;
      });
      
      data.nfts.forEach(function(nft) {
        if (CORE_METADATA[nft.nftokenID]) {
          nft.metadata = CORE_METADATA[nft.nftokenID];
        }
      });

      if (data.nfts.length === 0 && !requestedOwner) {
        data.nfts = FALLBACK_BROS;
        data.fallback = true;
      }
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, nfts: FALLBACK_BROS, fallback: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}