// services/fallbackClient.js
const axios = require('axios');

async function callFallbackAPI(prompt) {
  try {
    const response = await axios.post('https://api-inference.huggingface.co/models/meta-llama/Llama-3-8B-Instruct',
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000,
      }
    );
    return response.data?.generated_text || response.data[0]?.generated_text || null;
  } catch (error) {
    console.error('🔁 Fallback API error:', error.message);
    return null;
  }
}

module.exports = { callFallbackAPI };