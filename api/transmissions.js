export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const SUPABASE_URL = 'https://bwvnhlmvyjuowyyltraw.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3dm5obG12eWp1b3d5eWx0cmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzMwOTksImV4cCI6MjA5NTMwOTA5OX0.A51xIwF9TiTWw5BhWit1Pdf4dk-Pw1yK4wr8rrRGuOQ';

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/transmissions?select=*&order=date_added.desc`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: errorText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const transmissions = await response.json();
    return new Response(JSON.stringify({ transmissions }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=1, stale-while-revalidate'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
