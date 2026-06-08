export default async function handler(req, res) {
  const transmissions = [
    { transmission_text: "SIGNAL: NEUROLINK SYNCHRONIZATION AT 98%. OPERATIONAL STATUS: IMMINENT" },
    { transmission_text: "NOTICE: SECTOR 9 STATIC PURGE COMPLETE. PREPARING FOR DIRECT NEURAL RELAY" },
    { transmission_text: "BOLO: ALL OPERATIVES REPORT TO FUSION LAB. NEUROLINK STABILIZATION IN PROGRESS" }
  ];

  try {
    const response = await fetch('https://bwvnhlmvyjuowyyltraw.supabase.co/rest/v1/transmissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'c37f58b0-0d6d-5d61-8031-ff8b566c6ef6',
        'Authorization': 'Bearer c37f58b0-0d6d-5d61-8031-ff8b566c6ef6',
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