// services/fallbackClient.js

const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function callFallbackAPI(prompt, images = null) {
  console.log('\n[Melissa-Backend] Running OpenRouter FallbackAPI!');
  //console.log('📝 Prompt:', prompt);

  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.length < 10) {
    console.warn('❌ OPENROUTER_API_KEY is missing or invalid.');
    return null;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini:free',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    //console.log('📦 Raw response:', JSON.stringify(data, null, 2));

    if (data.error) {
      console.warn('⚠️ OpenRouter Error:', data.error.message);
      return null;
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('⚠️ Missing content in response. Full payload:', JSON.stringify(data));
      return null;
    }

    //console.log('💬 Model content:', content);

    // ✅ Normalize Gemini-style ingredient response shape
    let normalized = content;
    try {
      const parsed = JSON.parse(content);
      //console.log('🔍 Parsed JSON content:', parsed);

      if (
        parsed &&
        typeof parsed === 'object' &&
        'amount' in parsed &&
        'unit' in parsed &&
        'ingredient' in parsed
      ) {
        normalized = JSON.stringify({ ingredients: [parsed] });
        //console.log('🔧 Normalized single ingredient object into array:', normalized);
      }
    } catch (parseErr) {
      console.warn('⚠️ Failed to parse content as JSON. Returning raw string.');
    }

    return normalized;
  } catch (error) {
    console.error('🔁 Fallback API error:', error.message);
    return null;
  }
}

module.exports = { callFallbackAPI };