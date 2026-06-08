export default async function handler(req, res) {
  const transmissions = [
    { transmission_text: "SIGNAL: NEUROLINK SYNCHRONIZATION AT 98%. OPERATIONAL STATUS: IMMINENT" },
    { transmission_text: "NOTICE: SECTOR 9 STATIC PURGE COMPLETE. PREPARING FOR DIRECT NEURAL RELAY" },
    { transmission_text: "BOLO: ALL OPERATIVES REPORT TO FUSION LAB. NEUROLINK STABILIZATION IN PROGRESS" }
  ];

  // Supabase Anon Key found in project configuration
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3dm5obG12eWp1b3d5eWx0cmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzMwOTksImV4cCI6MjA5NTMwOTA5OX0.A51xIwF9TiTWw5BhWit1Pdf4dk-Pw1yK4wr8rrRGuOQ';

  try {
    const response = await fetch('https://bwvnhlmvyjuowyyltraw.supabase.co/rest/v1/transmissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(transmissions)
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).send(`Failed to initialize: ${error}`);
    }

    return res.status(200).send("NeuroLink transmissions successfully initialized!");
  } catch (error) {
    return res.status(500).send(`Server error: ${error.message}`);
  }
}
