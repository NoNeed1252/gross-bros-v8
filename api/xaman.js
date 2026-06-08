const { XummSdk } = require('xumm-sdk');

// Verbatim keys to resolve "Invalid API Key" error
const apiKey = '88e5dad9-93bf-4e2b-a4b8-563f16545c2d';
const apiSecret = 'b09b8426-7a2e-4317-bf54-24eb976e5ed0';

const sdk = new XummSdk(apiKey, apiSecret);

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
