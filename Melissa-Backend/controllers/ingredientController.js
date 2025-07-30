const genAI = require('../services/geminiClient');
const { callFallbackAPI } = require('../services/fallbackClient');
const { formatSubstitutionAmountPrompt, formatSubstitutionListPrompt } = require('../utils/formatPrompt');


// 
function safeParse(text) {
  if (typeof text !== 'string') return null;

  // 🧼 Remove Markdown fences
  const cleaned = text.replace(/^\s*```json\s*|\s*```$/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('❗ Failed to parse response:', cleaned);
    return null;
  }
}

//
async function getSuggestedIngredients(req, res) {
  const { ingredient = '' } = req.params;
  if (!ingredient) return res.status(400).json({ error: 'Missing ingredient parameter.' });
  
  console.log(`\n[Melissa-Backend] 🔍 Generating substitutes for "${ingredient}"`);
  const prompt = formatSubstitutionListPrompt(ingredient);

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json|```/g, '').trim();

    const parsed = safeParse(responseText);
    if (!parsed?.substitutes) throw new Error('Invalid Gemini output');

    return res.json({ substitutes: parsed.substitutes });
  } catch (err) {
    console.warn('⚠️ Gemini failed:', err.message);

    try {
      const fallback = await callFallbackAPI(prompt);
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

  console.log('\n[Melissa-Backend] 🔍 Generating substitute amount for swap inputs:', { originalName, substituteName });
  const prompt = formatSubstitutionAmountPrompt(originalName, substituteName);

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
      const fallback = await callFallbackAPI(prompt);
      const parsedFallback = safeParse(fallback?.body || fallback);

      if (parsedFallback?.adjustedAmount) {
        return res.json({ adjustedAmount: parsedFallback.adjustedAmount });
      }

      // 💡 Handle normalized fallback structure
      const first = parsedFallback?.ingredients?.[0];
      if (first?.amount && first?.unit && first?.ingredient) {
        const adjustedAmount = [first.amount, first.unit, first.ingredient]
          .filter(Boolean)
          .join(' ')
          .trim();
        return res.json({ adjustedAmount });
      }

      console.warn('⚠️ Fallback returned unexpected shape:', parsedFallback);
    } catch (fallbackErr) {
      console.error('❌ Fallback also failed:', fallbackErr.message);
    }

    return res.status(500).json({ error: 'Failed to suggest swap amount.' });
  }
}

module.exports = { getSuggestedIngredients, getSwapAmount };