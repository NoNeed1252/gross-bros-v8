const express = require('express');
const router = express.Router();

// Environment variables - Support both Xaman and Xumm naming conventions
const apiKey = process.env.NEXT_PUBLIC_XAMAN_API_KEY || process.env.XAMAN_API_KEY || process.env.XUMM_API_KEY;
const apiSecret = process.env.XAMAN_API_SECRET || process.env.XUMM_API_SECRET;

const XAMAN_API_BASE = 'https://xumm.app/api/v1/platform';

/**
 * Helper to make authenticated requests to Xaman API
 */
async function xamanFetch(endpoint, options = {}) {
  const url = `${XAMAN_API_BASE}${endpoint}`;
  
  if (!apiKey || !apiSecret) {
    throw new Error('Xaman API configuration missing (API Key or Secret)');
  }

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
    let errorMsg = 'Xaman API error';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error?.message || \`Xaman API Error: \${response.status}\`;
    } catch (e) {
      errorMsg = \`Xaman API HTTP \${response.status}\`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

/**
 * Handle payload creation logic
 */
async function handleCreatePayload(req, res) {
  try {
    const body = req.method === 'POST' ? req.body : req.query;
    const { txjson, options } = body;

    const payloadBody = {
      txjson: txjson || { TransactionType: 'SignIn' },
      options: options || {}
    };

    const result = await xamanFetch('/payload', {
      method: 'POST',
      body: JSON.stringify(payloadBody),
    });

    return res.status(200).json({
      uuid: result.uuid,
      next: result.next.always,
      refs: result.refs, // Include full refs for QR fallback
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
    const result = await xamanFetch(\`/payload/\${uuid}\`);
    const isSigned = result.meta.resolved && result.meta.signed;
    const address = result.response.account || null;

    return res.status(200).json({
      signed: isSigned,
      address: address,
      status: result.meta.status,
      response: result.response
    });
  } catch (error) {
    console.error('Error checking Xaman payload:', error);
    return res.status(500).json({ error: error.message });
  }
}

const handler = async (req, res) => {
  const body = req.method === 'POST' ? req.body : req.query;
  const action = body?.action;
  const uuid = body?.uuid;

  if (action === 'create-payload') {
    return handleCreatePayload(req, res);
  }

  if (action === 'check-payload') {
    return handleCheckPayload(req, res, uuid);
  }

  return res.status(400).json({ error: 'Invalid action use create-payload or check-payload' });
};

// Vercel Serverless Function entry point
module.exports = handler;

// Also expose as router for local server.js
module.exports.router = router;
router.all('/', handler);
