export const config = {
  runtime: 'edge',
};

const CRYPTO_KNOWLEDGE = 'CORE XRPL KNOWLEDGE:\n- XRPL (XRP Ledger): A decentralized public blockchain. Fast (3-5 sec settlements), low cost, and carbon-neutral.\n- DEX (Decentralized Exchange): The XRPL has a built-in DEX for trading any issued currency.\n- Trustlines: Required to hold any token other than XRP. It is a security feature.\n- AMM (Automated Market Maker): Recently activated on XRPL (XLS-30).\n\nGGB ECOSYSTEM TOKENS:\n- BERT: Fuel for Gross Bros engine.\n- DROP: Liquid energy for Fusion Lab.\n- DBY: Utility for specimens.\n- RLUSD: Ripple USD stablecoin.\n- FUZZY ($fuzzy): Neural static asset.\n- PHNIX: Rebirth protocol.\n- XRP ARMY: Frontline defense.\n- PRINCE: Royal-tier lineage.\n- BEARXRPH: Defensive mitigation.\n- PIDGEON: Information relay.\n- SLT: Synthetic Ledger Toxin.\n- XRPH: Industrial-grade derivative.\n- XRT: Backbone communication.\n\nTERMINOLOGY:\n- Cold Wallet: Offline safety.\n- Hot Wallet: Connected app.\n- Keys/Seed: NEVER share.\n- First Ledger: Primary breeding ground for meme-specimens.';

async function getLivePrices(mentionedSymbols) {
  var prices = {};
  if (mentionedSymbols) mentionedSymbols.forEach(function(sym) { prices[sym] = null; });
  var idsToFetch = ['ripple', 'bitcoin', 'ethereum', 'solana'];
  try {
    var results = await Promise.allSettled([
      fetch('https://api.geckoterminal.com/api/v2/networks/xrpl/pools').then(function(r) { return r.json(); }),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=' + idsToFetch.join(',') + '&vs_currencies=usd').then(function(r) { return r.json(); })
    ]);
    var dexRes = results[0].status === 'fulfilled' ? results[0].value : null;
    var geckoRes = results[1].status === 'fulfilled' ? results[1].value : null;
    if (geckoRes) {
      if (geckoRes.ripple) prices.XRP = geckoRes.ripple.usd.toString();
      if (geckoRes.bitcoin) prices.BTC = geckoRes.bitcoin.usd.toString();
      if (geckoRes.ethereum) prices.ETH = geckoRes.ethereum.usd.toString();
      if (geckoRes.solana) prices.SOL = geckoRes.solana.usd.toString();
    }
  } catch (e) { console.error(e); }
  return prices;
}

async function getHoldings(address) {
  if (!address) return [];
  var BITHOMP_TOKEN = process.env.BITHOMP_TOKEN;
  try {
    var url = 'https://bithomp.com/api/v2/nfts?list=nfts&issuer=rP1wMvanhfmsm7Af4FcHvSvfhash43LWSY&taxon=1&owner=' + address;
    var res = await fetch(url, { headers: { 'x-bithomp-token': BITHOMP_TOKEN } });
    var data = await res.json();
    return data.nfts || [];
  } catch (e) { return []; }
}

export default async function handler(req) {
  var headers = { 'Content-Type': 'application/json' };
  var xamanKey = process.env.XAMAN_KEY;
  var xamanSecret = process.env.XAMAN_SECRET;
  
  try {
    return new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: headers });
  } catch (error) {
    throw new Error('Fatal error: ' + error.message);
  }
}