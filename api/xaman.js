const express = require('express');
const router = express.Router();

// Hardcoded Xaman keys to bypass Vercel environment variable injection failure
const apiKey = '88e5dad9-93bf-4e2b-a4b8-563f16545c2d';
const apiSecret = 'b09b8426-7a2e-4317-bf54-24eb976e5ed0';

const XAMAN_API_BASE = 'https://xumm.app/api/v1/platform';

/**
 * Helper to make authenticated requests to Xaman API
 */
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
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Xaman API error');
  }

  return response.json();
}

/**
 * Handle payload creation logic
 */
async function handleCreatePayload(req, res) {
  try {
    const { txjson, options } = req.body;

    const payloadBody = {
      txjson: txjson || {
        TransactionType: 'SignIn',
      },
      options: options || {}
    };

    const result = await xamanFetch('/payload', {
      method: 'POST',
      body: JSON.stringify(payloadBody),
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
  } catch (error) {
    console.error('Error creating Xaman payload:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Handle payload status check logic
 */
async function handleCheckPayload(req, res, uuid) {
  if (!uuid) {
    return res.status(400).json({ error: 'Missing uuid' });
  }

  try {
    const result = await xamanFetch(`/payload/${uuid}`);

    const isSigned = result.meta.resolved && result.meta.signed;
    const address = result.response.account || null;

    return res.status(200).json({
      signed: isSigned,
      address: address,
      account: address,
      status: result.meta.status,
      meta: result.meta,
      response: result.response
    });
  } catch (error) {
    console.error('Error checking Xaman payload:', error);
    return res.status(500).json({ error: error.message });
  }
}

router.post('/', async (req, res) => {
  const action = req.body.action || req.query.action;
  const uuid = req.body.uuid || req.query.uuid;

  if (action === 'create-payload') {
    return handleCreatePayload(req, res);
  }

  if (action === 'check-payload') {
    return handleCheckPayload(req, res, uuid);
  }

  return res.status(400).json({ error: 'Invalid action' });
});

router.get('/', async (req, res) => {
  const action = req.query.action || req.body?.action;
  const uuid = req.query.uuid || req.body?.uuid;

  if (action === 'create-payload') {
    return handleCreatePayload(req, res);
  }

  if (action === 'check-payload') {
    return handleCheckPayload(req, res, uuid);
  }

  return res.status(400).json({ error: 'Invalid action' });
});

module.exports = router;