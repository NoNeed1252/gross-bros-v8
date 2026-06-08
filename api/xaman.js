const { XummSdk } = require('xumm-sdk');

const sdk = new XummSdk(process.env.XUMM_API_KEY, process.env.XUMM_API_SECRET);

module.exports = async (req, res) => {
  // Allow both body (POST) and query (GET) for the action parameter
  const action = req.body?.action || req.query?.action;

  if (action === 'create-payload') {
    try {
      const payload = await sdk.payload.create(req.body.payload || req.body);
      return res.status(200).json(payload);
    } catch (error) {
      console.error('Xaman Create Payload Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (action === 'check-payload') {
    const uuid = req.query.uuid || req.body.uuid;
    try {
      const payload = await sdk.payload.get(uuid);
      return res.status(200).json(payload);
    } catch (error) {
      console.error('Xaman Check Payload Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
};