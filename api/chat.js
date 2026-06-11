const fetch = require("node-fetch");

module.exports = async (req, res) => {
  try {
    const { messages, operative } = req.body;
    
    // Check for critical environment variables
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "SIGNAL LOST: SYSTEM KEY MISSING" });
    }

    const systemPrompt = "You are the Gross Bros AI Terminal. Character: Gritty assistant. Context: " + 
      (operative?.name || "Unknown") + ". Traits: " + 
      ((operative?.traits || []).join(", ") || "None") + 
      ". Task: Assist with NFT analysis. Stay concise. Use NO backticks.";

    const fullMessages = [{ role: "system", content: systemPrompt }].concat(messages || []);
    const model = "meta-llama/llama-3.1-8b-instruct";

    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: fullMessages
      })
    });

    if (!openRouterRes.ok) {
      const errorBody = await openRouterRes.text();
      return res.status(500).json({ error: "SIGNAL LOST: API FAULT - " + errorBody });
    }

    const data = await openRouterRes.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "SIGNAL LOST: " + error.message });
  }
};