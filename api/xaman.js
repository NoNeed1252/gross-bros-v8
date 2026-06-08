const express = require('express');
const router = express.Router();

// Environment variables
const apiKey = process.env.NEXT_PUBLIC_XAMAN_API_KEY;
const apiSecret = process.env.XAMAN_API_SECRET;

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
 * Refactored to be generic: uses txjson and options from the request body
 */
async function handleCreatePayload(req, res) {
  try {
    const { txjson, options } = req.body;

    // Use provided txjson or fallback to a basic SignIn
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
      next: result.next.always, // The link to open Xaman/show QR
      qrUrl: result.refs.qr_png,
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

    // Check if signed and resolve address
    const isSigned = result.meta.resolved && result.meta.signed;
    const address = result.response.account || null;

    return res.status(200).json({
      signed: isSigned,
      address: address,
      status: result.meta.status,
      response: result.response // Include full response for metadata verification
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

  return res.status(400).json({ error: 'Invalid action use create-payload or check-payload' });
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

  return res.status(400).json({ error: 'Invalid action use create-payload or check-payload' });
});

module.exports = router;
