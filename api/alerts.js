export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const supabaseUrl = 'https://bwvnhlmvyjuowyyltraw.supabase.co';
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3dm5obG12eWp1b3d5eWx0cmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzMwOTksImV4cCI6MjA5NTMwOTA5OX0.A51xIwF9TiTWw5BhWit1Pdf4dk-Pw1yK4wr8rrRGuOQ';

  try {
    // Fetch only alerts from the last 48 hours to prevent stale data
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000)).toISOString();
    
    const response = await fetch(`${supabaseUrl}/rest/v1/alerts?select=message,created_at&created_at=gt.${fortyEightHoursAgo}&order=created_at.desc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch alerts');
    }

    const alerts = await response.json();
    
    return new Response(JSON.stringify({ alerts }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=60, stale-while-revalidate'
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ alerts: [], error: error.message }), {
      status: 200, // Return 200 so frontend can handle empty array fallback
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
