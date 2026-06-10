export const config = {
  runtime: 'edge',
};

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

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers });

  try {
    const { searchParams } = new URL(req.url);
    let action = searchParams.get('action');
    let uuid = searchParams.get('uuid');
    let body = {};

    if (req.method === 'POST') {
      body = await req.json();
      action = action || body.action;
      uuid = uuid || body.uuid;
    }

    if (action === 'create-payload') {
      const txjson = body.txjson;
      const options = body.options;
      const result = await xamanFetch('/payload', {
        method: 'POST',
        body: JSON.stringify({
          txjson: txjson || { TransactionType: 'SignIn' },
          options: options || {}
        }),
      });

      return new Response(JSON.stringify({
        uuid: result.uuid,
        next: {
          always: result.next.always,
          app_deep_link: result.next.app_deep_link
        },
        qrUrl: result.refs.qr_png,
        refs: result.refs
      }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    if (action === 'check-payload') {
      if (!uuid) return new Response(JSON.stringify({ error: 'Missing uuid' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
      const result = await xamanFetch(`/payload/${uuid}`);
      const isSigned = result.meta.resolved && result.meta.signed;
      return new Response(JSON.stringify({
        signed: isSigned,
        address: result.response.account || null,
        account: result.response.account || null,
        status: result.meta.status,
        meta: result.meta,
        response: result.response
      }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Xaman API error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
}
