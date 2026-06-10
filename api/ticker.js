export const config = {
  runtime: 'edge',
};

async function getXRPPrice() {
  const sources = [
    { url: 'https://api.coinbase.com/v2/prices/XRP-USD/spot', parse: (data) => data?.data?.amount },
    { url: 'https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd', parse: (data) => data?.ripple?.usd },
    { url: 'https://api.geckoterminal.com/api/v2/networks/xrpl/pools', parse: (data) => data?.data?.find(p => p.attributes?.name?.includes('XRP'))?.attributes?.base_token_price_usd }
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source.url);
      if (!response.ok) continue;
      const data = await response.json();
      const price = source.parse(data);
      if (price) return price.toString();
    } catch (e) {
      console.error(`Ticker source error for ${source.url}:`, e);
    }
  }
  return null;
}

export default async function handler(req) {
  try {
    const price = await getXRPPrice();
    
    if (price) {
      return new Response(JSON.stringify({
        xrp_price: parseFloat(price),
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ 
        error: 'signal misaligned', 
        message: 'Prices are currently unavailable' 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Ticker handler error:', error);
    return new Response(JSON.stringify({ error: 'signal misaligned' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
