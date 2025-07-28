const genAI = require('../services/geminiClient');
const { callFallbackAPI } = require('../services/fallbackClient');

// 
function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.warn('❗ Failed to parse Gemini response:', text);
    return null;
  }
}

//
async function getSuggestedIngredients(req, res) {
  const { ingredient = '' } = req.params;
  if (!ingredient) return res.status(400).json({ error: 'Missing ingredient parameter.' });

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You're a culinary assistant. Suggest three widely available substitutes for "${ingredient}".
      Reply with JSON: { "substitutes": ["Alt1", "Alt2", "Alt3"] }
          `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json|```/g, '').trim();

    const parsed = safeParse(responseText);
    if (!parsed?.substitutes) throw new Error('Invalid Gemini output');

    return res.json({ substitutes: parsed.substitutes });
  } catch (err) {
    console.warn('⚠️ Gemini failed:', err.message);

    try {
      const fallbackPrompt = `Suggest 3 common ingredient swaps for ${ingredient}. Respond as: { "substitutes": [...] }`;
      const fallback = await callFallbackAPI(fallbackPrompt);
      const parsedFallback = safeParse(fallback?.body || fallback);
      if (parsedFallback?.substitutes) {
        return res.json({ substitutes: parsedFallback.substitutes });
      }
    } catch (fallbackErr) {
      console.error('❌ Fallback also failed:', fallbackErr.message);
    }

    return res.status(500).json({ error: 'Failed to generate ingredient suggestions.' });
  }
}

//
async function getSwapAmount(req, res) {
  const { originalName, substituteName } = req.body;

  if (!originalName || !substituteName) {
    return res.status(400).json({ error: 'Missing parameters.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You're a culinary assistant helping with ingredient substitutions.

      Given "${originalName}", suggest the precise quantity of "${substituteName}" needed to match its role in a recipe. Adjust based on flavor intensity, acidity, and typical usage.

      Respond only in structured JSON:
      {
        "amount": "just the numeric portion, e.g. ½",
        "unit": "measurement unit, e.g. tsp, tbsp, cup",
        "ingredient": "name of the substituted ingredient, e.g. ground star anise"
      }
      `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json|```/g, '').trim();

    const parsed = safeParse(responseText);
    if (!parsed?.amount || !parsed?.unit || !parsed?.ingredient) {
      throw new Error('Incomplete Gemini output');
    }

    const adjustedAmount = [parsed.amount, parsed.unit, parsed.ingredient].filter(Boolean).join(' ').trim();
    return res.json({ adjustedAmount });

  } catch (err) {
    console.warn('⚠️ Gemini suggestion failed:', err.message);

    try {
      const fallbackPrompt = `
Suggest an adjusted amount for swapping "${originalName}" with "${substituteName}".
Respond only as: { "adjustedAmount": "e.g. ½ tsp ground star anise" }
      `;
      const fallback = await callFallbackAPI(fallbackPrompt);
      const parsedFallback = safeParse(fallback?.body || fallback);
      if (parsedFallback?.adjustedAmount) {
        return res.json({ adjustedAmount: parsedFallback.adjustedAmount });
      }
    } catch (fallbackErr) {
      console.error('❌ Fallback also failed:', fallbackErr.message);
    }

    return res.status(500).json({ error: 'Failed to suggest swap amount.' });
  }
}

module.exports = { getSuggestedIngredients, getSwapAmount };