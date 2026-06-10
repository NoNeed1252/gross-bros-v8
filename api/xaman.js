const apiKey = '88e5dad9-93bf-4e2b-a4b8-563f16545c2d';
const apiSecret = 'b09b8426-7a2e-4317-bf54-24eb976e5ed0';
const XAMAN_API_BASE = 'https://xumm.app/api/v1/platform';

async function xamanFetch(endpoint, options = {}) {
  const url = `${XAMAN_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'X-API-Secret': apiSecret,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Xaman API error');
  }

  return response.json();
}

module.exports = async function handler(req, res) {
  const action = req.body?.action || req.query?.action;
  const uuid = req.body?.uuid || req.query?.uuid;

  try {
    if (action === 'create-payload') {
      const txjson = req.body?.txjson;
      const options = req.body?.options;
      const result = await xamanFetch('/payload', {
        method: 'POST',
        body: JSON.stringify({
          txjson: txjson || { TransactionType: 'SignIn' },
          options: options || {}
        }),
      });

      return res.status(200).json({
        uuid: result.uuid,
        next: {
          always: result.next.always,
          app_deep_link: result.next.app_deep_link
        },
        qrUrl: result.refs.qr_png,
        refs: result.refs
      });
    }

    if (action === 'check-payload') {
      if (!uuid) return res.status(400).json({ error: 'Missing uuid' });
      const result = await xamanFetch(`/payload/${uuid}`);
      const isSigned = result.meta.resolved && result.meta.signed;
      return res.status(200).json({
        signed: isSigned,
        address: result.response.account || null,
        account: result.response.account || null,
        status: result.meta.status,
        meta: result.meta,
        response: result.response
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Xaman API error:', error);
    return res.status(500).json({ error: error.message });
  }
};