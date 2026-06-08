export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const url = new URL(req.url);
  const filterDate = url.searchParams.get('date'); // Expected format: YYYY-MM-DD
  
  const SUPABASE_URL = 'https://bwvnhlmvyjuowyyltraw.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3dm5obG12eWp1b3d5eWx0cmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzMwOTksImV4cCI6MjA5NTMwOTA5OX0.A51xIwF9TiTWw5BhWit1Pdf4dk-Pw1yK4wr8rrRGuOQ';

  try {
    const nowStr = new Date().toISOString();
    // Use 'transmission_text' instead of 'content' to match Supabase schema
    let queryUrl = `${SUPABASE_URL}/rest/v1/transmissions?select=id,transmission_text,date_added&date_added=lte.${nowStr}&order=date_added.desc`;
    
    if (filterDate) {
      const startOfDay = `${filterDate}T00:00:00`;
      const endOfDay = `${filterDate}T23:59:59`;
      const limitDate = endOfDay < nowStr ? endOfDay : nowStr;
      queryUrl = `${SUPABASE_URL}/rest/v1/transmissions?select=id,transmission_text,date_added&date_added=gte.${startOfDay}&date_added=lte.${limitDate}&order=date_added.desc`;
    }

    const response = await fetch(queryUrl, {
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
