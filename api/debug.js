const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_API_KEY is not defined' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const data = await response.json();
    res.status(200).json({
      status: response.status,
      body: data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
