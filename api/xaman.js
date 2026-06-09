export const config = { runtime: 'edge' };
const apiKey = '88e5dad9-93bf-4e2b-a4b8-563f16545c2d';
const apiSecret = 'b09b8426-7a2e-4317-bf54-24eb976e5ed0';

async function xamanFetch(endpoint, options = {}) {
  const res = await fetch(`https://xumm.app/api/v1/platform${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, 'X-API-Secret': apiSecret, ...options.headers }
  });
  return res.json();
}

export default async function handler(req) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  if (action === 'create-payload') {
    const r = await xamanFetch('/payload', { method: 'POST', body: JSON.stringify({ txjson: { TransactionType: 'SignIn' } }) });
    return new Response(JSON.stringify({ uuid: r.uuid, qrUrl: r.refs.qr_png, next: r.next }), { headers: { 'Content-Type': 'application/json' } });
  }
  if (action === 'check-payload') {
    const r = await xamanFetch('/payload/' + url.searchParams.get('uuid'));
    return new Response(JSON.stringify({ signed: r.meta.signed, address: r.response.account }), { headers: { 'Content-Type': 'application/json' } });
  }
  return new Response('Invalid Action', { status: 400 });
}