// api/xaman.js (Edge Runtime version)
export const config = {
  runtime: 'edge',
};

// Hardcoded Xaman keys to bypass Vercel environment variable injection failure
const apiKey = '88e5dad9-93bf-4e2b-a4b8-563f16545c2d';
const apiSecret = 'b09b8426-7a2e-4317-bf54-24eb976e5ed0';

const XAMAN_API_BASE = 'https://xumm.app/api/v1/platform';

/**
 * Helper to make authenticated requests to Xaman API
 */
async function xamanFetch(endpoint, options = {}) {
  const url = \`\${XAMAN_API_BASE}\${endpoint}\`;
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
    throw new Error(errorData.error?.message || \`Xaman API error: \${response.status}\`);
  }

  return response.json();
}

/**
 * Handle payload creation logic
 */
async function handleCreatePayload(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { txjson, options } = body;

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

    return new Response(JSON.stringify({
      uuid: result.uuid,
      next: {
        always: result.next?.always,
        app_deep_link: result.next?.app_deep_link
      },
      qrUrl: result.refs?.qr_png,
      refs: result.refs
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    console.error('Error creating Xaman payload:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

/**
 * Handle payload status check logic
 */
async function handleCheckPayload(uuid) {
  if (!uuid) {
    return new Response(JSON.stringify({ error: 'Missing uuid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const result = await xamanFetch(\`/payload/\${uuid}\`);

    const isSigned = result.meta?.resolved && result.meta?.signed;
    const address = result.response?.account || null;

    return new Response(JSON.stringify({
      signed: isSigned,
      address: address,
      account: address,
      status: result.meta?.status,
      meta: result.meta,
      response: result.response
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    console.error('Error checking Xaman payload:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export default async function handler(req) {
  const url = new URL(req.url);
  let action = url.searchParams.get('action');
  let uuid = url.searchParams.get('uuid');

  // Handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method === 'POST') {
    // If action/uuid not in query, we need to read body once
    if (!action || (action === 'check-payload' && !uuid)) {
      try {
        const clonedReq = req.clone();
        const body = await clonedReq.json().catch(() => ({}));
        action = action || body.action;
        uuid = uuid || body.uuid;
      } catch (e) {}
    }

    if (action === 'create-payload') {
      return handleCreatePayload(req);
    }

    if (action === 'check-payload') {
      return handleCheckPayload(uuid);
    }
  } else if (req.method === 'GET') {
    if (action === 'create-payload') {
      // Create payload via GET is possible but txjson would have to be in query or default
      return handleCreatePayload(req); 
    }

    if (action === 'check-payload') {
      return handleCheckPayload(uuid);
    }
  }

  return new Response(JSON.stringify({ error: 'Invalid action or method' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
