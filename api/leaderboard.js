export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const supabaseUrl = 'https://c37f58b0-0d6d-5d61-8031-ff8b566c6ef6.supabase.co';
  // Use SUPABASE_ANON_KEY from env, fallback to the known JWT for edge runtime consistency
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    if (!supabaseKey) {
      throw new Error('Supabase key not configured');
    }

    // Fetch operatives from the 'operatives' table
    const response = await fetch(`${supabaseUrl}/rest/v1/operatives?select=handle,chat_xp,trade_score,total_score&order=total_score.desc&limit=100`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Supabase error:', errText);
      throw new Error('Failed to fetch leaderboard data');
    }

    const data = await response.json();
    
    // Map database fields to the expected frontend format
    const leaderboard = data.map(op => ({
      name: op.handle || 'Unknown Operative',
      chatXp: op.chat_xp || 0,
      tradeScore: op.trade_score || 0,
      totalScore: op.total_score || 0
    }));

    return new Response(JSON.stringify({ leaderboard }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=30, stale-while-revalidate'
      },
    });

  } catch (error) {
    console.error('Leaderboard API Error:', error.message);
    
    // Fallback to empty leaderboard if database query fails
    return new Response(JSON.stringify({ 
      leaderboard: [],
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
