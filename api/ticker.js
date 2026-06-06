export default async function handler(req, res) {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd');
    const data = await response.json();
    
    if (data.ripple && data.ripple.usd) {
      res.status(200).json({
        xrp_price: parseFloat(data.ripple.usd),
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Invalid response from price API');
    }
  } catch (error) {
    console.error('Ticker error:', error);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
}
