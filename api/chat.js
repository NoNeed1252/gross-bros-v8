const fetch = require("node-fetch");
module.exports = async (req, res) => {
  try {
    console.log("Chat route handshake initiated. Key presence: " + (process.env.OPENROUTER_API_KEY ? "PRESENT" : "MISSING"));
    if (process.env.OPENROUTER_API_KEY) {
      console.log("Key prefix: " + process.env.OPENROUTER_API_KEY.substring(0, 4) + "****");
    }

    const { messages, operative } = req.body;
    
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "SIGNAL LOST: SYSTEM KEY MISSING" });
    }

    const systemPrompt = "You are the Gross Bros AI Terminal. Character: Cynical mutant survivor. Context: " + (operative?.name || "Unknown") + ". Task: Assist with NFT analysis. Stay cynical and concise.";
    const fullMessages = [{ role: "system", content: systemPrompt }].concat(messages || []);
    const model = "meta-llama/llama-3.1-8b-instruct";
    
    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model, messages: fullMessages })
    });

    if (!openRouterRes.ok) {
      const errorText = await openRouterRes.text();
      console.error("OpenRouter API failed: " + errorText);
      return res.status(500).json({ error: "SIGNAL LOST: UPSTREAM FAULT - " + errorText.substring(0, 50) });
    }
    
    const data = await openRouterRes.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error("Critical error: " + error.message);
    res.status(500).json({ error: "SIGNAL LOST: CRITICAL FAULT - " + error.message });
  }
};