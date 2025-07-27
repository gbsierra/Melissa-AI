const genAI = require('../services/geminiClient');
const { formatPrompt } = require('../../Melissa/utils/formatPrompt');
const { callFallbackAPI } = require('../services/fallbackClient');

function safeParse(text, source) {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.warn(`❗ Failed to parse ${source} response:\n`, text);
    return null;
  }
}

function extractRecipeFromMarkdown(text) {
  const titleMatch = text.match(/\*\*(.*?)\*\*/);
  const ingredientsMatch = text.match(/\*\*Ingredients:\*\*\n([\s\S]+?)\n\n/);
  const stepsMatch = text.match(/\*\*Instructions:\*\*\n([\s\S]+?)(\n\n|\n\*\*|$)/);

  return {
    title: titleMatch?.[1]?.trim() || 'Untitled',
    ingredients: ingredientsMatch?.[1]?.trim().split('\n').map(i => i.replace(/^\*+\s*/, '').trim()),
    instructions: stepsMatch?.[1]?.trim().split('\n').map(s => s.replace(/^\d+\.\s*/, '').trim()),
  };
}

function normalizeRecipe(raw, prompt = '', servings = '') {
  return {
    dishName: raw.title ?? 'Untitled',
    ingredients: raw.ingredients ?? [],
    instructions: raw.instructions ?? raw.steps ?? [],
    servings: servings ? parseInt(servings) : null,
    prompt,
    photo: null,
  };
}

async function generateRecipe(req, res) {
  const {
    imageTags = [],
    voiceText = '',
    manualText = '',
    query = '',
    mode = '',
    servings = '',
    difficulty = '',
    cookware = ''
  } = req.body || {};

  console.log('[Melissa] 🔍 Incoming body:', req.body);
  console.log('[Melissa] 📂 Incoming files:', req.files);
  console.log(`[Melissa] 🍳 Mode selected: ${mode}`);

  if (!mode) {
    return res.status(400).json({ error: 'Missing input mode (image-only, voice-only, fusion, or text-only)' });
  }

  const prompt = formatPrompt(imageTags, voiceText || manualText || query || '', mode, servings, difficulty, cookware);
  console.log('[Melissa] 🧠 Formatted Prompt:\n', prompt);

  let input;

  if (mode === 'image-only' || mode === 'fusion') {
    const imageFields = ['image1', 'image2'];
    const imageParts = [];

    for (const field of imageFields) {
      const file = req.files?.[field]?.[0];
      if (file?.buffer) {
        console.log(`[Melissa] 🖼 ${field} received: ${file.originalname}, ${file.size} bytes`);
        imageParts.push({
          inlineData: {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype || 'image/jpeg',
          },
        });
      } else {
        console.warn(`[Melissa] ⚠️ ${field} missing or has no buffer`);
      }
    }

    if (imageParts.length === 0) {
      return res.status(400).json({ error: 'Missing valid image uploads (image1/image2)' });
    }

    input = [{ text: prompt }, ...imageParts];
  } else {
    input = prompt;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(input);
    const responseText = result.response.text().replace(/```json|```/g, '').trim();

    const rawRecipe = safeParse(responseText, 'Gemini') || extractRecipeFromMarkdown(responseText);
    if (!rawRecipe) throw new Error('Gemini returned invalid recipe format');

    const recipe = normalizeRecipe(rawRecipe, prompt, servings);
    console.log('[Melissa] ✅ Gemini normalized recipe:', recipe);
    return res.json(recipe);
  } catch (err) {
    const errMsg = err?.message?.toLowerCase?.() || '';
    const isQuota = errMsg.includes('quota');

    console.warn('⚠️ Gemini failed:', err.message);
    if (isQuota) {
      console.warn('💡 Detected quota error — using fallback API.');
    }

    try {
      const fallbackText = await callFallbackAPI(prompt);
      if (!fallbackText || fallbackText.statusCode === 403) {
        console.error('❌ Fallback API failed or unauthorized');
        return res.status(500).json({ error: 'Gemini failed and fallback API is unavailable.' });
      }

      const rawFallback = safeParse(fallbackText.body || fallbackText, 'Fallback');
      if (!rawFallback) {
        return res.status(500).json({ error: 'Fallback API returned invalid recipe format.' });
      }

      const fallbackRecipe = normalizeRecipe(rawFallback, prompt, servings);
      console.log('[Melissa] 🔄 Fallback normalized recipe:', fallbackRecipe);
      return res.json(fallbackRecipe);
    } catch (fallbackErr) {
      console.error('❌ Fallback parse failed:', fallbackErr.message);
      return res.status(500).json({ error: 'Fallback API parse failed unexpectedly.' });
    }
  }
}

module.exports = { generateRecipe };