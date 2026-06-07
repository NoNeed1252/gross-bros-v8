export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Mock data for the leaderboard with performance-based scoring
  // In a real app, this would fetch from a database or KV store
  const players = [
    { name: "Operative Alpha", chatXp: 1250, tradeScore: 840 },
    { name: "Neon Stalker", chatXp: 980, tradeScore: 1120 },
    { name: "Ghost Protocol", chatXp: 2100, tradeScore: 450 },
    { name: "Cipher Bro", chatXp: 600, tradeScore: 1800 },
    { name: "Void Runner", chatXp: 1500, tradeScore: 720 },
    { name: "Static Signal", chatXp: 400, tradeScore: 300 }
  ];

  const leaderboard = players.map(p => ({
    ...p,
    totalScore: p.chatXp + p.tradeScore
  })).sort((a, b) => b.totalScore - a.totalScore);

  return new Response(JSON.stringify({ leaderboard }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=60, stale-while-revalidate'
    },
  });
}
