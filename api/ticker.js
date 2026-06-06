export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd');
    const data = await response.json();
    
    if (data.ripple && data.ripple.usd) {
      return new Response(JSON.stringify({
        xrp_price: parseFloat(data.ripple.usd),
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error('Invalid response from price API');
    }
  } catch (error) {
    console.error('Ticker error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch price' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
