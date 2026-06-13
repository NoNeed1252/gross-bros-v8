export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  
  const requestedOwner = searchParams.get('owner');
  const issuer = searchParams.get('issuer') || "rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY";
  const taxon = searchParams.get('taxon') || "1";
  const list = searchParams.get('list') || "nfts";
  
  const BITHOMP_TOKEN = process.env.BITHOMP_API_KEY || "95b64250-f24f-4654-9b4b-b155a3a6867b";
  const suppressedWallets = [
    "rNCY8dCi23nfyG74v8uE8V1G8Q8K265z6R",
    "rsuHaTvJh1bDmDoxX9QcKP7HEBSBt4XsHx"
  ];

  const FALLBACK_BROS = [
    {
      nftokenID: "000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5B8672043058CBFA7",
      uri: "697066733A2F2F62616679626569657579613433777134343368663764766D69617A6B6673686F7363686661796B62797067676533716E35676366646E656A6570692F47726F73732042726F7320233134302E6A736F6E",
      metadata: {
        name: "Gross Bros #140",
        description: "The Galactic Gross Bros emerged from the cosmic wreckage of a failed interplanetary mining operation on XRP-7.",
        image: "ipfs://bafybeibvrgdhhag4iycctbqal3443vqlmi5idhgrpdauk3kxczoqdkynom/gross-bros-#140.png"
      }
    },
    {
      nftokenID: "000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5CF4CF142058CBFA8",
      uri: "697066733A2F2F62616679626569657579613433777134343368663764766D69617A6B6673686F7363686661796B62797067676533716E35676366646E656A6570692F47726F73732042726F73202334362E6A736F6E",
      metadata: {
        name: "Gross Bros #46",
        description: "Born from the blue static rupture on XRP-7, these grotesque entities guard the remnants of their XRP roots.",
        image: "ipfs://bafybeibvrgdhhag4iycctbqal3443vqlmi5idhgrpdauk3kxczoqdkynom/gross-bros-#46.png"
      }
    },
    {
      nftokenID: "000807D0FACF61119F5D27B29C245AB27DAE47EE1E031BE5E632C245058CBFA9",
      uri: "697066733A2F2F62616679626569657579613433777134343368663764766D69617A6B6673686F7363686661796B62797067676533716E35676366646E656A6570692F47726F73732042726F7320233132352E6A736F6E",
      metadata: {
        name: "Gross Bros #125",
        description: "Fused with the raw digital essence of the XRP Ledger, the Gross Bros seek new digital frontiers.",
        image: "ipfs://bafybeibvrgdhhag4iycctbqal3443vqlmi5idhgrpdauk3kxczoqdkynom/gross-bros-#125.png"
      }
    }
  ];

  try {
    let apiUrl = "https://bithomp.com/api/v2/nfts?list=" + list + "&issuer=" + issuer + "&taxon=" + taxon;
    if (requestedOwner) {
      apiUrl += "&owner=" + requestedOwner;
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        "x-bithomp-token": BITHOMP_TOKEN
      }
    });

    let data = { nfts: [] };
    if (response.ok) {
      data = await response.json();
    } else {
      data.nfts = FALLBACK_BROS;
      data.fallback = true;
    }

    if (data.nfts && Array.isArray(data.nfts)) {
      data.nfts = data.nfts.filter(nft => {
        const owner = nft.owner || nft.account;
        if (suppressedWallets.includes(owner)) {
          return requestedOwner === owner;
        }
        return true;
      });
      
      if (data.nfts.length === 0 && !requestedOwner) {
        data.nfts = FALLBACK_BROS;
        data.fallback = true;
      }
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, nfts: FALLBACK_BROS, fallback: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
